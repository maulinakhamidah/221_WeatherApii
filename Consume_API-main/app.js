const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/lokasi', async (req, res) => {
  const kota = req.query.kota;
  if (!kota) {
    return res.status(400).json({ message: 'Parameter nama lokasi/kota harus diisi' });
  }

  try {
    const apiKey = process.env.MAPTILER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'MAPTILER_API_KEY belum dikonfigurasi di file .env' });
    }

    const response = await axios.get(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json?key=${apiKey}&language=id`
    );

    if (!response.data.features || response.data.features.length === 0) {
      return res.status(404).json({ message: 'Lokasi tidak ditemukan' });
    }

    const feature = response.data.features[0];
    const [longitude, latitude] = feature.center || feature.geometry.coordinates;
    const context = feature.context || [];

    const countryObj = context.find(c => c.id && c.id.startsWith('country')) || {};
    const negara = countryObj.text || feature.properties?.country || 'Indonesia';

    let provinsi = null;

    const provinceObj = context.find(
      c => c.id && (c.id.startsWith('region') || c.id.startsWith('province') || c.id.startsWith('state'))
    );
    if (provinceObj && provinceObj.text) {
      provinsi = provinceObj.text;
    }

    if (!provinsi && feature.properties?.region) {
      provinsi = feature.properties.region;
    }

    if (!provinsi && feature.place_name) {
      const parts = feature.place_name.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        provinsi = parts[parts.length - 2];
      } else if (parts.length === 2) {
        provinsi = parts[0];
      }
    }

    let kecamatan = null;
    const districtObj = context.find(
      c => c.id && (c.id.startsWith('district') || c.id.startsWith('subdistrict') || c.id.startsWith('locality') || c.id.startsWith('place'))
    );
    if (districtObj && districtObj.text) {
      kecamatan = districtObj.text;
    } else if (feature.text) {
      kecamatan = feature.text;
    }

    res.json({
      input_lokasi: kota,
      negara: negara || 'Tidak Terdeteksi',
      provinsi: provinsi || 'Tidak Terdeteksi',
      kecamatan: kecamatan || 'Tidak Terdeteksi',
      longitude: longitude !== undefined ? longitude : '-',
      latitude: latitude !== undefined ? latitude : '-'
    });

  } catch (error) {
    console.error('Error Geocoding:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghubungkan ke MapTiler API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});