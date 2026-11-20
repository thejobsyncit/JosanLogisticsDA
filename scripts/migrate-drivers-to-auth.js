/**
 * ONE-TIME MIGRATION SCRIPT: Drivers to Supabase Auth
 * 
 * SERVER-SIDE ONLY - NEVER RUN OR BUNDLE INSIDE THE REACT NATIVE CLIENT.
 * 
 * Usage:
 *   node scripts/migrate-drivers-to-auth.js
 * 
 * Environment Variables required:
 *   SUPABASE_URL=https://xewecflkzxgnczukaana.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<your-secret-service-role-key>
 * 
 * Security:
 *   - Uses crypto.randomBytes for secure temporary passwords.
 *   - NEVER logs, prints, or outputs plain-text passwords.
 *   - Triggers Supabase password recovery / setup link so drivers can set their own passwords.
 */

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "https://xewecflkzxgnczukaana.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("================================================================================");
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is required to run this migration script.");
  console.error("Run with: SUPABASE_SERVICE_ROLE_KEY=\"<key>\" node scripts/migrate-drivers-to-auth.js");
  console.error("================================================================================");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log("--------------------------------------------------------------------------------");
  console.log("JOSAN LOGISTICS - DRIVER TO SUPABASE AUTH MIGRATION");
  console.log(`Connecting to: ${supabaseUrl}`);
  console.log("--------------------------------------------------------------------------------\n");

  // 1. Fetch all drivers from public.drivers
  const { data: drivers, error: driversError } = await supabaseAdmin
    .from("drivers")
    .select("id, employee_id, name, email, phone, status, license_number, user_id");

  if (driversError) {
    console.error("Failed to query public.drivers:", driversError.message);
    process.exit(1);
  }

  if (!drivers || drivers.length === 0) {
    console.log("No driver records found in public.drivers.");
    return;
  }

  console.log(`Found ${drivers.length} total driver record(s) in public.drivers.\n`);

  // 2. Separate drivers without email
  const driversWithoutEmail = [];
  const driversWithEmail = [];

  for (const driver of drivers) {
    if (!driver.email || !driver.email.trim()) {
      driversWithoutEmail.push(driver);
    } else {
      driversWithEmail.push(driver);
    }
  }

  // 3. Report drivers with NULL email
  if (driversWithoutEmail.length > 0) {
    console.warn("⚠️  [ACTION REQUIRED] DRIVERS WITH NULL/EMPTY EMAIL FOUND:");
    console.warn("These drivers CANNOT be provisioned into Supabase Auth until an email is provided:\n");
    console.table(
      driversWithoutEmail.map((d) => ({
        ID: d.id,
        "Employee ID": d.employee_id || "N/A",
        Name: d.name || "N/A",
        Phone: d.phone || "N/A",
        Status: d.status || "N/A",
      }))
    );
    console.warn("\nPlease update these drivers with valid email addresses in Supabase before migrating them.\n");
  } else {
    console.log("✓ All drivers have an email address populated.\n");
  }

  // 4. Fetch existing Supabase Auth users to prevent duplicates
  const { data: { users: existingAuthUsers }, error: authListError } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (authListError) {
    console.error("Failed to list existing Supabase Auth users:", authListError.message);
    process.exit(1);
  }

  const authUserByEmail = new Map();
  for (const u of existingAuthUsers || []) {
    if (u.email) {
      authUserByEmail.set(u.email.toLowerCase(), u);
    }
  }

  // 5. Migrate drivers with email
  console.log(`Migrating ${driversWithEmail.length} driver(s) with email to Supabase Auth...\n`);

  let newlyCreatedCount = 0;
  let alreadyLinkedCount = 0;
  let newlyLinkedCount = 0;
  const errors = [];

  for (const driver of driversWithEmail) {
    const email = driver.email.trim().toLowerCase();
    try {
      let authUserId = null;
      const existingUser = authUserByEmail.get(email);

      if (existingUser) {
        authUserId = existingUser.id;
        if (driver.user_id === authUserId) {
          alreadyLinkedCount++;
          console.log(`[ALREADY LINKED] Driver ${driver.id} (${driver.name}) -> Auth ID: ${authUserId}`);
          continue;
        }
      } else {
        // Approach: Cryptographically random temporary password + password reset email trigger.
        // We do NOT print, log, or email the temporary password to maintain zero plaintext exposure.
        const tempPassword = crypto.randomBytes(24).toString("base64url") + "!A1";

        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: driver.name,
            role: "DRIVER",
            driver_id: driver.id,
            employee_id: driver.employee_id,
          },
        });

        if (createError) {
          throw new Error(`Failed to create Auth user for ${email}: ${createError.message}`);
        }

        authUserId = created.user.id;
        newlyCreatedCount++;
        console.log(`[CREATED AUTH USER] Driver ${driver.id} (${driver.name}) -> Auth ID: ${authUserId}`);

        // Trigger password setup/recovery link (sent to driver's email)
        try {
          await supabaseAdmin.auth.resetPasswordForEmail(email);
          console.log(`  └─> Triggered password setup email to ${email}`);
        } catch (inviteErr) {
          console.warn(`  └─> Note: Could not dispatch password reset email: ${inviteErr.message}`);
        }
      }

      // Update public.drivers with user_id
      const { error: updateDriverError } = await supabaseAdmin
        .from("drivers")
        .update({ user_id: authUserId })
        .eq("id", driver.id);

      if (updateDriverError) {
        throw new Error(`Failed to update drivers.user_id: ${updateDriverError.message}`);
      }

      // Upsert into public.profiles to maintain role-based access
      await supabaseAdmin.from("profiles").upsert(
        {
          id: authUserId,
          user_id: authUserId,
          name: driver.name,
          email: email,
          phone: driver.phone || "",
          role: "DRIVER",
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      newlyLinkedCount++;
    } catch (err) {
      console.error(`[ERROR] Driver ${driver.id} (${driver.email}): ${err.message}`);
      errors.push({ id: driver.id, email, error: err.message });
    }
  }

  // 6. Summary Report
  console.log("\n================================================================================");
  console.log("MIGRATION SUMMARY");
  console.log("================================================================================");
  console.log(`Total Drivers Processed:         ${drivers.length}`);
  console.log(`Drivers with NULL Email (Skipped): ${driversWithoutEmail.length}`);
  console.log(`Existing Auth Users Linked:      ${alreadyLinkedCount}`);
  console.log(`New Auth Users Created:          ${newlyCreatedCount}`);
  console.log(`Drivers Newly Updated:           ${newlyLinkedCount}`);
  console.log(`Failures/Errors:                 ${errors.length}`);
  console.log("================================================================================\n");

  if (errors.length === 0 && driversWithoutEmail.length === 0) {
    console.log("✓ Verification complete: All drivers are safely linked to Supabase Auth.");
    console.log("✓ Next step: Run the following SQL to drop the plaintext password column:\n");
    console.log("    ALTER TABLE public.drivers DROP COLUMN IF EXISTS password;\n");
  } else if (driversWithoutEmail.length > 0) {
    console.log("⚠️  Please add emails for the remaining drivers and rerun this script before dropping the password column.");
  }
}

runMigration().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});

