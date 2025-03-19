# Küre Oyunu

Web tarayıcısında bilgisayara karşı oynanabilen Küre oyunu.

## Proje Hakkında

Bu proje, geleneksel "Küre" oyununun web tarayıcısı üzerinde oynanabilir bir versiyonudur. React ve TypeScript kullanılarak geliştirilmiştir. Oyun, kullanıcının bilgisayara karşı oynamasına olanak tanır ve çeşitli zorluk seviyeleri içerir.

## Oyun Kuralları

1. **Oyuncular ve Taşlar:**
   - Oyun iki oyuncu ile oynanır: Mor taşlı oyuncu ve Turuncu taşlı oyuncu
   - Mor oyuncu her zaman oyuna ilk başlar
   - Oyuncuların taşları, başlangıçta belirlenen sıralarda dizilir

2. **Taşların Hareket Kuralları:**
   - Başlangıç sırasındaki taşlar yalnızca ileriye veya çapraza hareket edebilir
   - Başlangıç sırasından ayrılan taşlar geri dönemez
   - Başlangıç sırasından çıkmış taşlar ileri, geri, sağa, sola veya çapraza bir birim hareket edebilir

3. **Oyun Alanındaki Sınırlamalar:**
   - Taşlar, yatay, dikey veya çaprazda dört tane yan yana gelemez
   - Eğer bir oyuncu dört taşı sıralarsa, hamlesi geçersiz sayılır ve taşını geri alarak kurallı bir hamle yapması gerekir

4. **Rakip Taşı Ele Geçirme:**
   - Bir oyuncu, rakibinin taşını kendi taşlarının arasına sıkıştırırsa, sıkışan taşı oyun dışına çıkarır
   - İki taş arasına giren oyuncunun taşı alınamaz

5. **Oyun Sonu ve Kazanma:**
   - Bir oyuncu rakibinin dört taşını oyun dışına çıkarırsa seti kazanır
   - Oyuncu üç defa kural ihlali yaparsa (3 uyarı cezası alırsa) seti kaybeder
   - Oyun 3 set üzerinden oynanır ve 2 seti kazanan oyuncu oyunu kazanır

## Özellikler

- Güzel ve kullanıcı dostu arayüz
- Geçerli hamlelerin görsel olarak gösterilmesi
- Üç farklı zorluk seviyesi (Kolay, Orta, Zor)
- Hamleyi geri alma özelliği
- Oyun kurallarının açıklaması
- Mobil cihazlarla uyumlu tasarım

## Kurulum ve Çalıştırma

Projeyi yerel olarak çalıştırmak için:

```bash
# Gerekli paketleri yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm start
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## Teknolojiler

- React
- TypeScript
- CSS

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
# kure
