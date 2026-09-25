const locations = [
  {
    name: "Banani",
    latitude: 23.7937,
    longitude: 90.4066,
  },
  {
    name: "Gulshan",
    latitude: 23.7925,
    longitude: 90.4078,
  },
  {
    name: "Mohakhali",
    latitude: 23.7808,
    longitude: 90.4,
  },
  {
    name: "Dhanmondi",
    latitude: 23.7465,
    longitude: 90.376,
  },
  {
    name: "Mirpur",
    latitude: 23.8223,
    longitude: 90.3654,
  },
  {
    name: "Uttara",
    latitude: 23.8759,
    longitude: 90.3795,
  },
  {
    name: "Farmgate",
    latitude: 23.7579,
    longitude: 90.3894,
  },
  {
    name: "Bashundhara",
    latitude: 23.8151,
    longitude: 90.4255,
  },
];

async function seedLocations(pool) {
  for (const location of locations) {
    await pool.query(
      `
        INSERT INTO locations
        (
            name,
            latitude,
            longitude
        )
        VALUES($1,$2,$3)
        ON CONFLICT(name)
        DO NOTHING
      `,
      [location.name, location.latitude, location.longitude],
    );
  }

  console.log("Locations seeded successfully");
}

module.exports = seedLocations;
