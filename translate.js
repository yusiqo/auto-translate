// ==UserScript==
// @name         Auto Translate
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Tarayıcı diline göre kelimeleri anlık olarak değiştirir.
// @author       Siz
// @match        *://*/*
// @exclude      *://*github.com/*
// @exclude      *://*content.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Dil ayarına göre JSON dosyalarının URL'leri
    const jsonUrls = {
        'tr': 'https://raw.githubusercontent.com/yusiqo/auto-translate/main/az.json',
        'en': 'https://raw.githubusercontent.com/yusiqo/auto-translate/main/az.json'
    };

    // Tarayıcı dilini belirle
    const userLanguage = navigator.language || navigator.userLanguage;
    const langCode = userLanguage.startsWith('tr') ? 'tr' : 'en';

    // JSON dosyasının URL'sini seç
    const jsonUrl = jsonUrls[langCode];

    let replacements = {};

    // JSON dosyasını yükleyen fonksiyon
    function loadReplacements() {
        fetch(jsonUrl)
            .then(response => response.json())
            .then(data => {
                replacements = data;
                // JSON yüklendiğinde, mevcut içeriği değiştiriyoruz
                replaceTextContent(document.body);
            })
            .catch(error => console.error('Kelime eşlemeleri yüklenirken hata:', error));
    }

    // Kelimenin orijinal şekline göre değiştirme fonksiyonu
    function replaceWord(match) {
        const lowerCaseMatch = match.toLowerCase();
        let replacement = replacements[lowerCaseMatch];

        if (replacement === undefined) {
            return match; // Eşleşme bulunamazsa, orijinal kelimeyi döndür
        }

        if (match === match.toUpperCase()) {
            // Eğer tüm harfler büyükse, tüm harfler büyük olarak değiştir
            replacement = replacement.toUpperCase();
        } else if (match[0] === match[0].toUpperCase()) {
            // Eğer ilk harf büyükse, ilk harfi büyük yaparak değiştir
            replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }

        return replacement;
    }

    // Metin düğümleri ve değer özniteliklerini değiştiren fonksiyon
    function replaceTextContent(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.textContent;
            for (let key of Object.keys(replacements)) {
                let regex = new RegExp(key, 'gi');
                text = text.replace(regex, replaceWord);
            }
            node.textContent = text;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Elementlerin textContent ve value özniteliklerini kontrol et
            if (node.value) {
                for (let key of Object.keys(replacements)) {
                    let regex = new RegExp(key, 'gi');
                    node.value = node.value.replace(regex, replaceWord);
                }
            }
            node.childNodes.forEach(replaceTextContent);
        }
    }

    // Gözlemleme işlemi için MutationObserver kullanıyoruz
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                replaceTextContent(node);
            });
        });
    });

    // Belge üzerinde gözlemlemeyi başlatıyoruz
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // JSON dosyasını yükle
    loadReplacements();
})();
