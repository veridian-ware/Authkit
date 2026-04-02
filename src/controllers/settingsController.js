const { CompanySettings } = require('../models');
const path = require('path');

exports.get = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();

    if (!settings) {
      settings = await CompanySettings.create({});
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

exports.update = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }

    const { company_name, primary_color, secondary_color, accent_color, dark_mode, sectors } = req.body;

    await settings.update({
      company_name: company_name || settings.company_name,
      primary_color: primary_color || settings.primary_color,
      secondary_color: secondary_color || settings.secondary_color,
      accent_color: accent_color || settings.accent_color,
      dark_mode: dark_mode !== undefined ? dark_mode : settings.dark_mode,
      sectors: sectors || settings.sectors,
    });

    res.json({ settings, id: settings.id });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido un logo' });
    }

    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }

    await settings.update({ logo_path: `/uploads/${req.file.filename}` });

    res.json({ settings, logoUrl: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Error al subir logo' });
  }
};
