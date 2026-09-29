

  try {
    const apiKey = process.env.MAPTILER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'MAPTILER_API_KEY belum dikonfigurasi di file .env' });
    }

    const response = await axios.get(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json?key=${apiKey}&language=id`
    );

  