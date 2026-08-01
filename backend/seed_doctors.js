import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const passwordHash = await bcrypt.hash('doctor123', 10);

    const doctorsData = [
      {
        email: 'elizabeth.blackwell@hippohealth.com',
        fullName: 'Elizabeth Blackwell',
        specialization: 'Cardiology',
        hospital: 'Hippo General Hospital',
        experience: 12,
        bio: 'Experienced cardiologist specializing in preventive medicine and heart health diagnostics.',
        license: 'LIC-100223'
      },
      {
        email: 'joseph.lister@hippohealth.com',
        fullName: 'Joseph Lister',
        specialization: 'General Surgery',
        hospital: 'St. Jude Clinical Care',
        experience: 15,
        bio: 'Pioneer of antiseptic medicine with extensive research in advanced surgery techniques.',
        license: 'LIC-200334'
      },
      {
        email: 'alice.hamilton@hippohealth.com',
        fullName: 'Alice Hamilton',
        specialization: 'Occupational Medicine',
        hospital: 'Hippo Health AI Labs',
        experience: 10,
        bio: 'Dedicated specialist focusing on environmental health and industrial toxicology logs verification.',
        license: 'LIC-300445'
      }
    ];

    console.log('Starting seed...');

    for (const doc of doctorsData) {
      // 1. Insert user
      const userRes = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, onboarding_complete)
         VALUES ($1, $2, $3, 'DOCTOR', true)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [doc.email, passwordHash, doc.fullName]
      );

      const userId = userRes.rows[0].id;

      // 2. Insert doctor profile
      await pool.query(
        `INSERT INTO doctor_profiles (user_id, license_number, specialization, years_experience, bio, hospital_affiliation, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (license_number) DO UPDATE SET
           specialization = EXCLUDED.specialization,
           years_experience = EXCLUDED.years_experience,
           bio = EXCLUDED.bio,
           hospital_affiliation = EXCLUDED.hospital_affiliation`,
        [userId, doc.license, doc.specialization, doc.experience, doc.bio, doc.hospital]
      );

      console.log(`Seeded doctor: Dr. ${doc.fullName} (User ID: ${userId})`);
    }

    console.log('Seeding complete successfully.');
  } catch (err) {
    console.error('Error seeding doctors:', err);
  } finally {
    await pool.end();
  }
}

main();
