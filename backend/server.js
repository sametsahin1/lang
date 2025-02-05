const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect('mongodb://127.0.0.1:27017/multilang', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB bağlantısı başarılı');
}).catch((err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

// Translation şeması
const translationSchema = new mongoose.Schema({
  lang: { type: String, required: true },
  translations: { type: Object, default: {} }
});

const Translation = mongoose.model('Translation', translationSchema);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API çalışıyor' });
});

// API Endpoints
app.get('/api/translations', async (req, res) => {
  try {
    console.log('GET /api/translations isteği alındı');
    const translations = await Translation.find();
    console.log('Bulunan çeviriler:', translations);
    res.json(translations);
  } catch (error) {
    console.error('Çeviriler yüklenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/translations/:lang', async (req, res) => {
  try {
    const translation = await Translation.findOne({ lang: req.params.lang });
    
    if (!translation) {
      return res.status(404).json({ error: 'Çeviri bulunamadı' });
    }

    res.json(translation.translations);
  } catch (error) {
    console.error('Çeviri yüklenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/translations/:lang', async (req, res) => {
  try {
    const { lang } = req.params;
    const newTranslations = req.body;
    
    // Mevcut çevirileri bul
    let translation = await Translation.findOne({ lang });
    
    if (!translation) {
      // Yeni dil için kayıt oluştur
      translation = new Translation({ 
        lang,
        translations: {}
      });
    }

    // Mevcut çevirileri koru ve yenileri ekle
    const updatedTranslations = {
      ...translation.translations,
      ...newTranslations
    };

    // Güncelle
    translation.translations = updatedTranslations;
    await translation.save();

    res.json(translation.translations);

  } catch (error) {
    console.error('Translation update error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Translation update failed' 
    });
  }
});

app.get('/api/languages', async (req, res) => {
  try {
    console.log('GET /api/languages isteği alındı');
    const translations = await Translation.find({}, 'lang');
    console.log('MongoDB\'den gelen veriler:', translations);
    
    const languages = translations.map(t => ({
      code: t.lang,
      name: getLanguageName(t.lang),
      isActive: true
    }));
    
    console.log('İstemciye gönderilen diller:', languages);
    res.json(languages);
  } catch (error) {
    console.error('Diller yüklenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper fonksiyon - dil koduna göre dil adını döndürür
function getLanguageName(code) {
  const languageNames = {
    'tr': 'Türkçe',
    'en': 'English',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'it': 'Italiano',
    'ru': 'Русский',
    'ar': 'العربية',
    'zh': '中文',
    'ja': '日本語'
  };
  return languageNames[code] || code;
}

app.post('/api/languages', async (req, res) => {
  try {
    console.log('POST /api/languages isteği alındı:', req.body);
    const { code, name } = req.body;

    // Dil zaten var mı kontrol edelim
    const existingLanguage = await Translation.findOne({ lang: code });
    console.log('Mevcut dil kontrolü:', existingLanguage);

    if (existingLanguage) {
      console.log('Bu dil zaten mevcut:', code);
      return res.status(400).json({ error: 'Bu dil zaten mevcut' });
    }

    // Yeni dil ekleyelim
    const translation = new Translation({
      lang: code,
      translations: {}
    });

    await translation.save();
    console.log('Yeni dil başarıyla eklendi:', translation);
    res.json({ code, name, isActive: true });
  } catch (error) {
    console.error('Dil eklenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/languages/:lang', async (req, res) => {
  try {
    console.log('DELETE /api/languages isteği alındı:', req.params.lang);
    await Translation.deleteOne({ lang: req.params.lang });
    res.json({ success: true });
  } catch (error) {
    console.error('Dil silinirken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 