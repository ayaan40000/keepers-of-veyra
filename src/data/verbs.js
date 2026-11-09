// 1.5 The Turning Stones: common verbs and their forms. Spanish: 15 common irregular verbs, present tense.
// Turkish: 10 common verbs, present continuous (-iyor), where the pattern is a rule and a few verbs change their stem
// (here gitmek gidiyor and yemek yiyor; etmek ediyor and demek diyor work the same way). Checked against standard grammars (Real Academia Espanola conjugation tables;
// Goksel and Kerslake, Turkish: A Comprehensive Grammar). Native-speaker review is still wanted before more are added.
export const PERSONS = {
  es: ['yo', 'tú', 'él / ella', 'nosotros', 'vosotros', 'ellos / ellas'],
  tr: ['ben', 'sen', 'o', 'biz', 'siz', 'onlar'],
};
export const TENSE = { es: 'present', tr: 'present continuous' };

export const VERBS = {
  es: [
    ['ser', 'to be (who or what)', ['soy', 'eres', 'es', 'somos', 'sois', 'son']],
    ['estar', 'to be (where or how)', ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están']],
    ['tener', 'to have', ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen']],
    ['ir', 'to go', ['voy', 'vas', 'va', 'vamos', 'vais', 'van']],
    ['hacer', 'to do, to make', ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen']],
    ['poder', 'to be able to', ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden']],
    ['querer', 'to want', ['quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren']],
    ['decir', 'to say', ['digo', 'dices', 'dice', 'decimos', 'decís', 'dicen']],
    ['venir', 'to come', ['vengo', 'vienes', 'viene', 'venimos', 'venís', 'vienen']],
    ['saber', 'to know (a fact)', ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben']],
    ['dar', 'to give', ['doy', 'das', 'da', 'damos', 'dais', 'dan']],
    ['ver', 'to see', ['veo', 'ves', 've', 'vemos', 'veis', 'ven']],
    ['salir', 'to go out', ['salgo', 'sales', 'sale', 'salimos', 'salís', 'salen']],
    ['poner', 'to put', ['pongo', 'pones', 'pone', 'ponemos', 'ponéis', 'ponen']],
    ['dormir', 'to sleep', ['duermo', 'duermes', 'duerme', 'dormimos', 'dormís', 'duermen']],
  ],
  tr: [
    ['gelmek', 'to come', ['geliyorum', 'geliyorsun', 'geliyor', 'geliyoruz', 'geliyorsunuz', 'geliyorlar']],
    ['gitmek', 'to go', ['gidiyorum', 'gidiyorsun', 'gidiyor', 'gidiyoruz', 'gidiyorsunuz', 'gidiyorlar']],
    ['almak', 'to take, to buy', ['alıyorum', 'alıyorsun', 'alıyor', 'alıyoruz', 'alıyorsunuz', 'alıyorlar']],
    ['vermek', 'to give', ['veriyorum', 'veriyorsun', 'veriyor', 'veriyoruz', 'veriyorsunuz', 'veriyorlar']],
    ['yapmak', 'to do, to make', ['yapıyorum', 'yapıyorsun', 'yapıyor', 'yapıyoruz', 'yapıyorsunuz', 'yapıyorlar']],
    ['görmek', 'to see', ['görüyorum', 'görüyorsun', 'görüyor', 'görüyoruz', 'görüyorsunuz', 'görüyorlar']],
    ['yemek', 'to eat', ['yiyorum', 'yiyorsun', 'yiyor', 'yiyoruz', 'yiyorsunuz', 'yiyorlar']],
    ['içmek', 'to drink', ['içiyorum', 'içiyorsun', 'içiyor', 'içiyoruz', 'içiyorsunuz', 'içiyorlar']],
    ['okumak', 'to read', ['okuyorum', 'okuyorsun', 'okuyor', 'okuyoruz', 'okuyorsunuz', 'okuyorlar']],
    ['konuşmak', 'to speak', ['konuşuyorum', 'konuşuyorsun', 'konuşuyor', 'konuşuyoruz', 'konuşuyorsunuz', 'konuşuyorlar']],
  ],
};

export const VERB_RULES = {
  es: 'Most Spanish verbs follow three patterns (-ar, -er, -ir). These fifteen do not, so each gets a picture for its odd forms: the yo form (tengo, hago, salgo) and the stem that changes (quiero, puedo, duermo). The nosotros and vosotros forms usually keep the plain stem.',
  tr: 'Turkish is regular: take the stem, add -iyor (the i follows the last vowel: ı, i, u or ü), then the person: -um, -sun, nothing, -uz, -sunuz, -lar. A stem ending in a or e loses it (bekle, bekliyor); a stem ending in ı, i, u or ü just adds -yor (oku, okuyor). Learn the rule once, and picture only the stems that change: gitmek becomes gid-, yemek becomes yi-.',
};
