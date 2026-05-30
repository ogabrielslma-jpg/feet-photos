"use client";

import { useEffect, useRef, useState } from "react";

type Msg = {
  id: number;
  name: string;
  text: string;
  minutesAgo: number;
  replyTo?: number;
};

const MESSAGES: Msg[] = [
  { id: 1, name: "Brunaprivy", text: "gente alguem ai?? meu insta sumiu do ar de novo", minutesAgo: 1320 },
  { id: 2, name: "Pesdaamanda", text: "to aqui Juh, o meu tbm ta esquisito hj", minutesAgo: 1310, replyTo: 1 },
  { id: 3, name: "onlypes_aananda", text: "o insta odeia a gnt, eh oficial", minutesAgo: 1305, replyTo: 1 },
  { id: 4, name: "lariis.priv", text: "deletei o app 3x essa semana, n adianta", minutesAgo: 1300, replyTo: 1 },
  { id: 5, name: "vivi.privy", text: "amg eu uso vpn pra postar agora, da uma melhorada", minutesAgo: 1295, replyTo: 1 },
  { id: 6, name: "carolperola", text: "vpn?? tipo qual?", minutesAgo: 1290, replyTo: 5 },
  { id: 7, name: "vivi.privy", text: "uso a protonvpn, eh free", minutesAgo: 1285, replyTo: 6 },
  { id: 8, name: "isafoot_22", text: "boa dica anota anota", minutesAgo: 1280 },
  { id: 9, name: "liaa_22", text: "tbm com problema, ja troquei de dispositivo, n eh isso", minutesAgo: 1275, replyTo: 1 },
  { id: 10, name: "viviana_oficial", text: "ja fiz tudo, instagram morreu pra creator adulto", minutesAgo: 1270, replyTo: 1 },
  { id: 11, name: "mahbianchi", text: "meninas acabou de cair r$ 380 aqui", minutesAgo: 1240 },
  { id: 12, name: "gabivendeoficial", text: "arrasou Ca!!! 👏", minutesAgo: 1235, replyTo: 11 },
  { id: 13, name: "Brunaprivy", text: "vai minha fia", minutesAgo: 1232, replyTo: 11 },
  { id: 14, name: "onlypes_aananda", text: "👏👏👏 quero ser vc qdo crescer", minutesAgo: 1230, replyTo: 11 },
  { id: 15, name: "camilavendinha", text: "tava precisando dessa energia, parabens amiga", minutesAgo: 1228, replyTo: 11 },
  { id: 16, name: "mahbianchi", text: "obg meninas vcs sao tudo", minutesAgo: 1225, replyTo: 11 },
  { id: 17, name: "babi_doll", text: "demais Ca, qm foi q pagou?? aquele cara da ferrari de novo?", minutesAgo: 1222, replyTo: 11 },
  { id: 18, name: "mahbianchi", text: "ele mesmo babi, ja é o 4o lance dele essa semana 💸", minutesAgo: 1220, replyTo: 17 },
  { id: 202, name: "dieniferbrum_", text: "amigas to feliz dms, fechei outro mes com mais de 5k", minutesAgo: 9 },
  { id: 203, name: "onlypes_aananda", text: "arrasa amg ❤️‍🔥❤️‍🔥", minutesAgo: 8, replyTo: 202 },
  { id: 204, name: "gabivendeoficial", text: "ta voando!! parabens", minutesAgo: 8, replyTo: 202 },
  { id: 205, name: "lariis.priv", text: "vontade de pegar tua receita rsrs", minutesAgo: 7, replyTo: 202 },
  { id: 206, name: "dieniferbrum_", text: "eh constancia gata, todo dia 1 foto nova 📸", minutesAgo: 7, replyTo: 202 },
  { id: 207, name: "babi_doll", text: "constancia eh td amg, parabens", minutesAgo: 7, replyTo: 202 },
  { id: 19, name: "helooo_priv", text: "gente o lance mais pao-duro da minha vida agora, cara dando 15 reais", minutesAgo: 1200 },
  { id: 20, name: "Pesdaamanda", text: "15 REAIS???? amg recusa ate o fim", minutesAgo: 1195, replyTo: 19 },
  { id: 21, name: "luvendinha", text: "tem cada um, axam q eh feirinha", minutesAgo: 1192, replyTo: 19 },
  { id: 22, name: "dieniferbrum_", text: "esse tipo de homem n merece nem resposta", minutesAgo: 1190, replyTo: 19 },
  { id: 23, name: "helooo_priv", text: "nem to respondendo, deixa la kkk", minutesAgo: 1188, replyTo: 19 },
  { id: 24, name: "rafapezinhah", text: "denuncia o perfil, esses cara baixa a media da plataforma", minutesAgo: 1185, replyTo: 19 },
  { id: 25, name: "lariis.priv", text: "+1 rafa, denuncio td chato", minutesAgo: 1183, replyTo: 19 },
  { id: 26, name: "biancavendinha", text: "to com cara pedindo audio falando nome dele com voz manhosa, paga 50 dolares. aceito?", minutesAgo: 1150 },
  { id: 27, name: "gabivendeoficial", text: "ACEITA AMG mais facil dinheiro do mundo", minutesAgo: 1145, replyTo: 26 },
  { id: 28, name: "lariis.priv", text: "ja fiz, ele fica MESES voltando, eh galinha dos ovos de ouro", minutesAgo: 1142, replyTo: 26 },
  { id: 29, name: "leticia_priv", text: "pega o dinheiro, mas grava sem mostrar boca pra ele n te identificar", minutesAgo: 1140, replyTo: 26 },
  { id: 30, name: "isafoot_22", text: "manda audio de fone, abafado, fica mais sensual e protegido", minutesAgo: 1138, replyTo: 26 },
  { id: 31, name: "biancavendinha", text: "vcs salvam minha vida, vou aceitar", minutesAgo: 1135, replyTo: 26 },
  { id: 32, name: "ninaa_real", text: "essa categoria do audio paga MT bem, mt mais q foto", minutesAgo: 1132, replyTo: 26 },
  { id: 33, name: "miareal", text: "confirmo, tenho 4 clientes fieis q so pedem audio agora", minutesAgo: 1130, replyTo: 26 },
  { id: 34, name: "mahirambo", text: "alguem indica salao bom de pedicure em sp zona sul??", minutesAgo: 1100 },
  { id: 35, name: "mirellapasso", text: "vai naquele do shopping morumbi, top demais", minutesAgo: 1095, replyTo: 34 },
  { id: 36, name: "claradalmaa", text: "+1 nesse, a moca eh perfeccionista", minutesAgo: 1093, replyTo: 34 },
  { id: 37, name: "yasmim__real", text: "eu vou na nail house em moema, recomendo MT", minutesAgo: 1090, replyTo: 34 },
  { id: 38, name: "dudazinhah", text: "eu faco em casa direto kkk mas se for pra foto vale pagar", minutesAgo: 1088, replyTo: 34 },
  { id: 39, name: "mahirambo", text: "anotei TUDO obg gatas", minutesAgo: 1085, replyTo: 34 },
  { id: 40, name: "dani_creator", text: "evita o do shopping center norte, machucaram minha cuticula la", minutesAgo: 1082, replyTo: 34 },
  { id: 41, name: "manuelaaa.b", text: "primeira venda do mes caiu agora!!! 100 dolares!!!! ❤️‍🔥", minutesAgo: 1050 },
  { id: 42, name: "carolperola", text: "comemora muito Manu, primeiro eh o + dificil", minutesAgo: 1045, replyTo: 41 },
  { id: 43, name: "Brunaprivy", text: "eba!!!", minutesAgo: 1043, replyTo: 41 },
  { id: 44, name: "vivi.privy", text: "🚀🚀🚀", minutesAgo: 1042, replyTo: 41 },
  { id: 45, name: "manuelaaa.b", text: "to tremenda ainda kkk, comprei o curso de 197 e ja paguei", minutesAgo: 1040, replyTo: 41 },
  { id: 46, name: "babi_doll", text: "se cuida com curso amg, mt deles eh furada", minutesAgo: 1037, replyTo: 45 },
  { id: 47, name: "manuelaaa.b", text: "esse foi indicacao de cunhada q tbm trabalha com isso", minutesAgo: 1035, replyTo: 46 },
  { id: 48, name: "Pesdaamanda", text: "gente, esmalte top q dura semana inteira sem lascar??", minutesAgo: 1000 },
  { id: 49, name: "onlypes_aananda", text: "risque diamond gel, dura uns 10 dias", minutesAgo: 995, replyTo: 48 },
  { id: 50, name: "lariis.priv", text: "colorama gel, tbm eh otimo e mais barato", minutesAgo: 993, replyTo: 48 },
  { id: 51, name: "biancavendinha", text: "o da impala dura mt, eu uso", minutesAgo: 991, replyTo: 48 },
  { id: 52, name: "gabivendeoficial", text: "qualquer um com 2 camadas + extra brilho top coat", minutesAgo: 990, replyTo: 48 },
  { id: 53, name: "isafoot_22", text: "uso o granado, eh bom e cheiro eh uma delicia", minutesAgo: 988, replyTo: 48 },
  { id: 54, name: "dieniferbrum_", text: "eu evito gel pq amarela com sol, prefiro normal", minutesAgo: 986, replyTo: 48 },
  { id: 55, name: "mahbianchi", text: "concordo, o gel craquela dps de um tempo", minutesAgo: 984, replyTo: 48 },
  { id: 56, name: "helooo_priv", text: "uso o ana hickmann, super durinho", minutesAgo: 982, replyTo: 48 },
  { id: 57, name: "liaa_22", text: "qual cor vcs mais vendem? cor neutra ou vermelho?", minutesAgo: 981, replyTo: 48 },
  { id: 58, name: "onlypes_aananda", text: "vermelho, MUITO mais. eh fetiche classico", minutesAgo: 980, replyTo: 57 },
  { id: 59, name: "Pesdaamanda", text: "amei as dicas <3", minutesAgo: 978, replyTo: 48 },
  { id: 60, name: "rafaela_oficial", text: "pessoal meu marido descobriu o q eu faço hj", minutesAgo: 920 },
  { id: 61, name: "yasmim__real", text: "oxe como reagiu??", minutesAgo: 915, replyTo: 60 },
  { id: 62, name: "rafaela_oficial", text: "ficou bravo no comeco mas qdo viu o saldo no banco aceitou kkkk", minutesAgo: 912, replyTo: 60 },
  { id: 63, name: "camilavendinha", text: "ahhaha dinheiro convence", minutesAgo: 910, replyTo: 60 },
  { id: 64, name: "mirellapasso", text: "o meu apoia desde o inicio, sou sortuda", minutesAgo: 908, replyTo: 60 },
  { id: 65, name: "dudazinhah", text: "amg q alivio q ele aceitou", minutesAgo: 906, replyTo: 60 },
  { id: 66, name: "claradalmaa", text: "ngm precisa saber nem mae nem marido se vc n quer", minutesAgo: 904, replyTo: 60 },
  { id: 67, name: "mahirambo", text: "eu n conto pra ngm, e n quero ouvir opiniao", minutesAgo: 902, replyTo: 60 },
  { id: 68, name: "rafapezinhah", text: "meu deu pra tras qdo descobriu, separamos. n se preocupa Re", minutesAgo: 900, replyTo: 60 },
  { id: 69, name: "carolperola", text: "fui treinar e o personal mexeu cmg, fingi q n entendi 😒", minutesAgo: 850 },
  { id: 70, name: "leticia_priv", text: "credo, troca de personal urgente!!", minutesAgo: 845, replyTo: 69 },
  { id: 71, name: "ninaa_real", text: "homem n perde uma, denuncia na academia", minutesAgo: 843, replyTo: 69 },
  { id: 72, name: "carolperola", text: "vou trocar mesmo, q saco", minutesAgo: 841, replyTo: 69 },
  { id: 73, name: "rafaela_oficial", text: "gente meu cliente bizarro voltou hj, eh o do bob esponja KKKK", minutesAgo: 800 },
  { id: 74, name: "isafoot_22", text: "para tudo o bob esponja? rsrs", minutesAgo: 795, replyTo: 73 },
  { id: 75, name: "rafaela_oficial", text: "ele quer agora uma meia da patrick estrela 💀", minutesAgo: 793, replyTo: 73 },
  { id: 76, name: "gabivendeoficial", text: "nao to rindo demais", minutesAgo: 791, replyTo: 73 },
  { id: 77, name: "vivi.privy", text: "amg da uma googlada na riachuelo, ja te salvou antes", minutesAgo: 789, replyTo: 73 },
  { id: 78, name: "rafaela_oficial", text: "tati minha salvadora kkkk obg", minutesAgo: 787, replyTo: 73 },
  { id: 79, name: "viviana_oficial", text: "esses bizarros pagam BEM, n julga n", minutesAgo: 785, replyTo: 73 },
  { id: 80, name: "rafaela_oficial", text: "ele paga 200 fixo por video kkkk uso o salario dele pra mercado", minutesAgo: 783, replyTo: 79 },
  { id: 81, name: "gabivendeoficial", text: "atencao golpe novo: cara fingindo q eh comprador pedindo pra mover pro tg, n caiam!!!", minutesAgo: 740 },
  { id: 82, name: "vivi.privy", text: "ouvi falar tbm. tudo deve ficar na plataforma", minutesAgo: 735, replyTo: 81 },
  { id: 83, name: "mahbianchi", text: "ja recebi msg assim, bloqueei", minutesAgo: 733, replyTo: 81 },
  { id: 84, name: "dieniferbrum_", text: "obg pelo aviso amg ❤️", minutesAgo: 731, replyTo: 81 },
  { id: 85, name: "miareal", text: "outro golpe: cara mandando pix falso, print da falso, n caiam", minutesAgo: 729, replyTo: 81 },
  { id: 86, name: "babi_doll", text: "sempre confirma no app do banco antes de enviar nada", minutesAgo: 727, replyTo: 81 },
  { id: 87, name: "dani_creator", text: "eu cai uma vez e perdi um trabalho de 3h, dor no coracao", minutesAgo: 725, replyTo: 81 },
  { id: 88, name: "yasmim__real", text: "comprei a luz por do sol q a Isa indicou, CHEGOU AGORA", minutesAgo: 700 },
  { id: 89, name: "biancavendinha", text: "vc vai amar 🌅", minutesAgo: 695, replyTo: 88 },
  { id: 90, name: "yasmim__real", text: "testando ja, mando print depois", minutesAgo: 693, replyTo: 88 },
  { id: 91, name: "Pesdaamanda", text: "alguem ja gravou com fone pq abafa som ambiente?", minutesAgo: 650 },
  { id: 92, name: "onlypes_aananda", text: "uso direto, ajuda mt qdo o vizinho ta fazendo obra", minutesAgo: 645, replyTo: 91 },
  { id: 93, name: "Pesdaamanda", text: "comprei um lapela barato no shopee, vou testar", minutesAgo: 643, replyTo: 91 },
  { id: 94, name: "luvendinha", text: "lapela do shopee dura pouco amg, melhor investir num bom", minutesAgo: 640, replyTo: 91 },
  { id: 95, name: "mirellapasso", text: "alguem de bh? to procurando cantinho discreto pra alugar 1x na semana so pra gravar", minutesAgo: 600 },
  { id: 96, name: "dudazinhah", text: "tem uns studios alugaveis no savassi, da uma olhada", minutesAgo: 595, replyTo: 95 },
  { id: 97, name: "mirellapasso", text: "obg, vou pesquisar", minutesAgo: 593, replyTo: 95 },
  { id: 98, name: "helooo_priv", text: "tbm to procurando o mesmo aqui em recife", minutesAgo: 590, replyTo: 95 },
  { id: 99, name: "mahirambo", text: "amg minha vizinha curiosa começou a perguntar com o q eu trabalho, q saco kkk", minutesAgo: 560 },
  { id: 100, name: "dieniferbrum_", text: "n conta nada amg, fica vaga", minutesAgo: 555, replyTo: 99 },
  { id: 101, name: "Brunaprivy", text: "diz q eh influencer de produtos de beleza, sempre funciona", minutesAgo: 553, replyTo: 99 },
  { id: 102, name: "lariis.priv", text: "melhor desculpa eh de produtos de beleza, da pra mostrar foto com creme", minutesAgo: 551, replyTo: 99 },
  { id: 103, name: "mahbianchi", text: "amiga ignora ela, vizinho ta sempre querendo saber", minutesAgo: 549, replyTo: 99 },
  { id: 104, name: "mahirambo", text: "vou seguir essa do esmalte e creme entao, obg gatas", minutesAgo: 547, replyTo: 99 },
  { id: 105, name: "ninaa_real", text: "passei por isso, segura firme. depois ela esquece", minutesAgo: 545, replyTo: 99 },
  { id: 106, name: "carolperola", text: "amgs voltei de uma soneca enorme kkk dormi muito", minutesAgo: 460 },
  { id: 107, name: "biancavendinha", text: "carol vc dorme demais kkkk descansou bem?", minutesAgo: 455, replyTo: 106 },
  { id: 108, name: "carolperola", text: "demais, dormi 11h direto 😴", minutesAgo: 453, replyTo: 106 },
  { id: 109, name: "manuelaaa.b", text: "alguem ja deu match com cliente q reconheceu vc em outra plataforma? to com medo disso", minutesAgo: 420 },
  { id: 110, name: "claradalmaa", text: "ja me aconteceu mas eu uso outro nome em cada lugar, nem ligo", minutesAgo: 415, replyTo: 109 },
  { id: 111, name: "yasmim__real", text: "anonimato eh nosso ouro, nunca solta foto de rosto", minutesAgo: 413, replyTo: 109 },
  { id: 112, name: "onlypes_aananda", text: "e tatuagem, marca, sinal, sempre cobre", minutesAgo: 411, replyTo: 109 },
  { id: 113, name: "leticia_priv", text: "tudo isso, e nunca conta cidade exata", minutesAgo: 409, replyTo: 109 },
  { id: 114, name: "manuelaaa.b", text: "anotando td, obg meninas", minutesAgo: 407, replyTo: 109 },
  { id: 115, name: "dudazinhah", text: "to com colica HORRIVEL, queria deitar mas tenho 2 leiloes ativos", minutesAgo: 380 },
  { id: 116, name: "Pesdaamanda", text: "amg toma um buscopan e descansa, leilao roda sozinho", minutesAgo: 375, replyTo: 115 },
  { id: 117, name: "dieniferbrum_", text: "agua morna no pe ajuda mt na colica", minutesAgo: 373, replyTo: 115 },
  { id: 118, name: "dudazinhah", text: "vou tomar e fica deitada, obg flores", minutesAgo: 371, replyTo: 115 },
  { id: 119, name: "lariis.priv", text: "amgs como vcs lidam com os arabes? o tradutor da plataforma ta uma porcaria, sempre traduz errado", minutesAgo: 340 },
  { id: 120, name: "Brunaprivy", text: "lariii o google tradutor eh melhor q o do whats, juro", minutesAgo: 335, replyTo: 119 },
  { id: 121, name: "mahbianchi", text: "uso o deepl, traduz arabe bem melhor q o google", minutesAgo: 333, replyTo: 119 },
  { id: 122, name: "isafoot_22", text: "as vezes ele pede uma coisa esquisita e eu n entendo, ai mando audio em ingles q vc resolve mais facil", minutesAgo: 331, replyTo: 119 },
  { id: 123, name: "gabivendeoficial", text: "aprende algumas palavras tipo shukran (obg) e habibi, eles ficam felizes", minutesAgo: 329, replyTo: 119 },
  { id: 124, name: "lariis.priv", text: "vou baixar o deepl entao, valeu mahbianchi", minutesAgo: 327, replyTo: 119 },
  { id: 125, name: "babi_doll", text: "arabe paga MUITO bem se tu trata bem, ja virei especialista kkk", minutesAgo: 325, replyTo: 119 },
  { id: 126, name: "mirellapasso", text: "amgs sumi pq fui dormir cedo, voltei, alguma novidade?", minutesAgo: 300 },
  { id: 127, name: "vivi.privy", text: "td calmo, conversamos sobre tradutor pra arabe kkkk", minutesAgo: 295, replyTo: 126 },
  { id: 128, name: "mirellapasso", text: "kkkk dica boa", minutesAgo: 293, replyTo: 126 },
  { id: 129, name: "mahirambo", text: "comprei aquele OLEO de coco da granado, juro q meu pe ta HIDRATADISSIMO", minutesAgo: 260 },
  { id: 130, name: "carolperola", text: "o cheiro tbm eh divino", minutesAgo: 255, replyTo: 129 },
  { id: 131, name: "biancavendinha", text: "amo amo amo esse oleo", minutesAgo: 253, replyTo: 129 },
  { id: 132, name: "manuelaaa.b", text: "to anotando td q vcs falam, vou comprar a feira inteira amanha", minutesAgo: 251, replyTo: 129 },
  { id: 133, name: "rafapezinhah", text: "qts ml? eh o pote pequeno?", minutesAgo: 250, replyTo: 129 },
  { id: 134, name: "mahirambo", text: "200ml, dura uns 2 meses fácil", minutesAgo: 248, replyTo: 133 },
  { id: 135, name: "viviana_oficial", text: "gente preciso desabafar, esses caras q ficam mandando 'oi gata' achando q sao especiais", minutesAgo: 230 },
  { id: 136, name: "liaa_22", text: "kkkk q pesadelo, ignoro td", minutesAgo: 227, replyTo: 135 },
  { id: 137, name: "yasmim__real", text: "+1, eu so respondo qdo tem lance no carrinho", minutesAgo: 225, replyTo: 135 },
  { id: 138, name: "miareal", text: "se vc respondeu uma vez, eles axam q ja sao seus amigos kkk", minutesAgo: 223, replyTo: 135 },
  { id: 139, name: "babi_doll", text: "tem cara MENTIROSO q diz q vai pagar e nunca paga", minutesAgo: 221, replyTo: 135 },
  { id: 140, name: "viviana_oficial", text: "exatamente!! ja levei calote 2x esse mes", minutesAgo: 219, replyTo: 139 },
  { id: 141, name: "helooo_priv", text: "por isso so confio em quem paga adiantado", minutesAgo: 217, replyTo: 135 },
  { id: 142, name: "gabivendeoficial", text: "gente, tem cara querendo q eu mande video descascando uma laranja com o pe 🍊 KKKK", minutesAgo: 220 },
  { id: 143, name: "Pesdaamanda", text: "menina o que", minutesAgo: 215, replyTo: 142 },
  { id: 144, name: "gabivendeoficial", text: "to falando, e paga 150!! vou tentar", minutesAgo: 213, replyTo: 142 },
  { id: 145, name: "onlypes_aananda", text: "deus me livre, mas $$ eh $$", minutesAgo: 211, replyTo: 142 },
  { id: 146, name: "yasmim__real", text: "depois conta se conseguiu, q tenso", minutesAgo: 209, replyTo: 142 },
  { id: 147, name: "luvendinha", text: "amg manda video sem mostrar caminho ate a cozinha, segurança", minutesAgo: 207, replyTo: 142 },
  { id: 148, name: "isafoot_22", text: "tiktok baniu meu perfil de novo 😡", minutesAgo: 180 },
  { id: 149, name: "leticia_priv", text: "amg, ja eh o que? quinto?", minutesAgo: 175, replyTo: 148 },
  { id: 150, name: "isafoot_22", text: "sexto. ja desisti, vou so focar aqui", minutesAgo: 173, replyTo: 148 },
  { id: 151, name: "claradalmaa", text: "tiktok eh guerra, melhor focar onde paga", minutesAgo: 171, replyTo: 148 },
  { id: 152, name: "Brunaprivy", text: "eu nem tento mais", minutesAgo: 169, replyTo: 148 },
  { id: 153, name: "dani_creator", text: "tiktok banco a gente sem motivo, mas o cara assediador tem 2 milhao de seguidor 🙄", minutesAgo: 167, replyTo: 148 },
  { id: 154, name: "ninaa_real", text: "isso eh fato, plataforma machista", minutesAgo: 165, replyTo: 148 },
  { id: 155, name: "mahbianchi", text: "comprei um par de saltos pra cliente q paga + caro com salto, ja amortizou na 1a venda", minutesAgo: 140 },
  { id: 156, name: "dieniferbrum_", text: "investimento certo. tudo q vc reinveste volta dobrado", minutesAgo: 135, replyTo: 155 },
  { id: 157, name: "vivi.privy", text: "+1, comprei luz de studio e paguei em 1 semana", minutesAgo: 133, replyTo: 155 },
  { id: 158, name: "rafapezinhah", text: "qual altura do salto Ca? to pensando em comprar tbm", minutesAgo: 131, replyTo: 155 },
  { id: 159, name: "mahbianchi", text: "comprei de 8cm e 12cm, o de 12 vende mais", minutesAgo: 129, replyTo: 158 },
  { id: 160, name: "miareal", text: "meninas preciso reclamar, tem um comprador q fica MUDANDO de mente toda hora", minutesAgo: 130 },
  { id: 161, name: "babi_doll", text: "conta amg", minutesAgo: 127, replyTo: 160 },
  { id: 162, name: "miareal", text: "pede foto, eu mando, ele diz q n era essa pose, pede outra, eh DESGASTANTE", minutesAgo: 125, replyTo: 160 },
  { id: 163, name: "Pesdaamanda", text: "amg bloqueia, esse tipo n compensa", minutesAgo: 123, replyTo: 160 },
  { id: 164, name: "lariis.priv", text: "ou cobra cada nova foto separado", minutesAgo: 121, replyTo: 160 },
  { id: 165, name: "miareal", text: "vou bloquear mesmo, cansei", minutesAgo: 119, replyTo: 160 },
  { id: 166, name: "rafaela_oficial", text: "alguem tem cupom de ifood?? to com fome", minutesAgo: 100 },
  { id: 167, name: "lariis.priv", text: "te mando no priv, vc ganha 20 reais", minutesAgo: 95, replyTo: 166 },
  { id: 168, name: "rafaela_oficial", text: "amg vc eh tudo", minutesAgo: 93, replyTo: 166 },
  { id: 169, name: "carolperola", text: "qual app vcs usam pra controlar o q ganha? to pensando em planilha mas eh trabalhoso", minutesAgo: 80 },
  { id: 170, name: "mahirambo", text: "uso o organizze, sincroniza com banco", minutesAgo: 75, replyTo: 169 },
  { id: 171, name: "claradalmaa", text: "mobills aqui, perfeito", minutesAgo: 73, replyTo: 169 },
  { id: 172, name: "mirellapasso", text: "google sheets velho de guerra kkkk", minutesAgo: 71, replyTo: 169 },
  { id: 173, name: "dudazinhah", text: "eu nem controlo, gasto td 💸", minutesAgo: 69, replyTo: 169 },
  { id: 174, name: "yasmim__real", text: "duda KKKK humor preto", minutesAgo: 67, replyTo: 169 },
  { id: 175, name: "liaa_22", text: "uso a calculadora do celular mesmo kkkk vergonha", minutesAgo: 65, replyTo: 169 },
  { id: 176, name: "manuelaaa.b", text: "consegui meu 2o pagamento, fechei o mes com R$ 2.280 (sou novata) ❤️", minutesAgo: 55 },
  { id: 177, name: "Pesdaamanda", text: "maravilha Manu, vc ta indo rapido!!", minutesAgo: 50, replyTo: 176 },
  { id: 178, name: "lariis.priv", text: "primeiros meses eh assim, daqui a 6 meses vc ta em 3k tranquilo", minutesAgo: 48, replyTo: 176 },
  { id: 179, name: "manuelaaa.b", text: "ai vontade de chorar 🥹 obg pela acolhida", minutesAgo: 46, replyTo: 176 },
  { id: 180, name: "viviana_oficial", text: "vai com tudo Manu, todas começam assim", minutesAgo: 44, replyTo: 176 },
  { id: 181, name: "gabivendeoficial", text: "consegui!! mandei o video da laranja e o cara TRANSFERIU 200 🍊💰", minutesAgo: 38 },
  { id: 182, name: "isafoot_22", text: "ahaha gloria a deus pelos esquisitos ricos", minutesAgo: 35, replyTo: 181 },
  { id: 183, name: "carolperola", text: "vou aceitar td pedido bizarro a partir de hj", minutesAgo: 33, replyTo: 181 },
  { id: 184, name: "mahbianchi", text: "kkkk mt bom Lari", minutesAgo: 31, replyTo: 181 },
  { id: 208, name: "dani_creator", text: "MENINAS pergunta seria: qual a pior bizarrice q ja pediram pra vcs?? to curiosa", minutesAgo: 32 },
  { id: 209, name: "viviana_oficial", text: "kkkkk amg, papelao molhado. tinha q pisar com o pe descalço", minutesAgo: 30, replyTo: 208 },
  { id: 210, name: "helooo_priv", text: "jura papelão??? amg", minutesAgo: 29, replyTo: 208 },
  { id: 211, name: "liaa_22", text: "pediram pra eu cantar parabens enquanto pisava num bolo de aniversario 🎂", minutesAgo: 28, replyTo: 208 },
  { id: 212, name: "isafoot_22", text: "ahahaha bolo, n consigo", minutesAgo: 27, replyTo: 208 },
  { id: 213, name: "miareal", text: "olha gente, pagando bem q mal tem 🤷‍♀️ eu faço quase tudo dentro do limite", minutesAgo: 26, replyTo: 208 },
  { id: 214, name: "babi_doll", text: "concordo Mia, se paga bem e n machuca ngm eu topo", minutesAgo: 25, replyTo: 208 },
  { id: 215, name: "miareal", text: "cara me pediu pra falar em grego. eu falando q n sabia e ele insistindo", minutesAgo: 24, replyTo: 208 },
  { id: 216, name: "ninaa_real", text: "grego kkkkk de onde tira isso", minutesAgo: 23, replyTo: 208 },
  { id: 217, name: "Brunaprivy", text: "ja pediram pra eu chorar fingindo, n consegui pq n sou atriz kkk", minutesAgo: 22, replyTo: 208 },
  { id: 218, name: "onlypes_aananda", text: "MENINAS to tremenda. cara me ofereceu MAIS se eu mostrasse o rosto. mandei so parte e ele pagou 600 REAIS", minutesAgo: 20, replyTo: 208 },
  { id: 219, name: "gabivendeoficial", text: "mel 600 reais??? amg vc eh genia", minutesAgo: 18, replyTo: 208 },
  { id: 220, name: "dieniferbrum_", text: "olha o do iogurte, queria q eu pisasse num pote de iogurte SEM TAMPA", minutesAgo: 16, replyTo: 208 },
  { id: 221, name: "rafapezinhah", text: "voces sao demais kkkkk eu so tive pedido normal ate hj, queria contar uma bizarra", minutesAgo: 14, replyTo: 208 },
  { id: 222, name: "luvendinha", text: "pediram pra eu fingir q era robo, falar em voz mecânica", minutesAgo: 11, replyTo: 208 },
  { id: 223, name: "mahirambo", text: "robô kkkkk imagina vc fazendo bip bop", minutesAgo: 9, replyTo: 208 },
  { id: 224, name: "yasmim__real", text: "gente o cara q queria q eu lesse uma receita de bolo enquanto mostrava o pe foi o + estranho", minutesAgo: 7, replyTo: 208 },
  { id: 185, name: "helooo_priv", text: "olha gente, mais um pedindo DESCONTO. vc paga desconto no supermercado? n. entao", minutesAgo: 35 },
  { id: 186, name: "luvendinha", text: "DEFENDIDOOOO. somos profissionais, n eh feira", minutesAgo: 32, replyTo: 185 },
  { id: 187, name: "ninaa_real", text: "qdo pedem desconto eu aumento o preco kkk eles aprendem", minutesAgo: 30, replyTo: 185 },
  { id: 188, name: "rafapezinhah", text: "nina vc eh um genio", minutesAgo: 28, replyTo: 187 },
  { id: 189, name: "babi_doll", text: "tatic do aumento de preco quando pedem desconto eh OURO", minutesAgo: 26, replyTo: 187 },
  { id: 190, name: "Brunaprivy", text: "gente ja fizeram leilao agora? ta movimentado?", minutesAgo: 28 },
  { id: 191, name: "onlypes_aananda", text: "extremamente, ta entrando lance a cada 2 min aqui", minutesAgo: 25, replyTo: 190 },
  { id: 192, name: "vivi.privy", text: "ta no fluxo agora, esse momento eh ouro", minutesAgo: 23, replyTo: 190 },
  { id: 193, name: "Brunaprivy", text: "to publicando AGORA entao 🚀", minutesAgo: 21, replyTo: 190 },
  { id: 194, name: "biancavendinha", text: "rolando promo nova naquela loja de meia fofa q a Cah recomendou", minutesAgo: 18 },
  { id: 195, name: "yasmim__real", text: "link plsssss", minutesAgo: 16, replyTo: 194 },
  { id: 196, name: "biancavendinha", text: "te mando no priv", minutesAgo: 15, replyTo: 194 },
  { id: 197, name: "leticia_priv", text: "alguem ai gravando agora? to inspirada", minutesAgo: 14 },
  { id: 198, name: "mirellapasso", text: "to to, qria fazer uma colab um dia ein", minutesAgo: 12, replyTo: 197 },
  { id: 199, name: "leticia_priv", text: "vamo sim, te chamo amanha", minutesAgo: 11, replyTo: 197 },
  { id: 200, name: "dudazinhah", text: "colica passou, milagres existem ✨", minutesAgo: 10 },
  { id: 201, name: "isafoot_22", text: "🙏🙏🙏", minutesAgo: 9, replyTo: 200 },
];

const AVATAR_URLS: Record<string, string> = {
  "Brunaprivy": "https://i.pinimg.com/736x/13/d8/55/13d85508ffa70b037a5f123cee75c0ec.jpg",
  "Pesdaamanda": "https://i.pinimg.com/736x/4d/47/97/4d4797b0cdb5e5fbef3f0d1d7c1e1524.jpg",
  "dieniferbrum_": "https://i.pinimg.com/736x/32/a3/fc/32a3fc5617df02a044dabc6dd4a41c64.jpg",
  "onlypes_aananda": "https://i.pinimg.com/736x/df/5c/8b/df5c8b26cdd1322c50e240089abf24d4.jpg",
  "lariis.priv": "https://i.pinimg.com/736x/b1/91/77/b19177c590811dd4cc1968fc1e07f9a7.jpg",
  "mahbianchi": "https://i.pinimg.com/736x/e8/be/c1/e8bec131a066434bd3b2657cde51f41a.jpg",
  "gabivendeoficial": "https://i.pinimg.com/736x/f9/3a/e6/f93ae6cdaaf89475ea5b17f7f795c088.jpg",
  "isafoot_22": "https://i.pinimg.com/736x/1b/26/9e/1b269e56c66f09fe4c0b9481d9c3b4b7.jpg",
  "camilavendinha": "https://i.pinimg.com/736x/bb/5f/d6/bb5fd6a808645393d0d6a1feca5d3dd1.jpg",
  "vivi.privy": "https://i.pinimg.com/736x/5a/6d/a0/5a6da034ea8b20afe9c1472ed8cd83b1.jpg",
  "rafaela_oficial": "https://i.pinimg.com/736x/52/26/ce/5226ce5cce4bb3a6607782eb4dfd9bed.jpg",
  "carolperola": "https://i.pinimg.com/736x/25/5f/de/255fde5da7d5b011074709d66cc33dcf.jpg",
  "biancavendinha": "https://i.pinimg.com/736x/85/4a/5f/854a5fbc7a00877972e1fa500d489a8d.jpg",
  "leticia_priv": "https://i.pinimg.com/1200x/a7/7b/64/a77b6430e8c91d338046b4b6a769909c.jpg",
  "mahirambo": "https://i.pinimg.com/736x/02/e8/ba/02e8ba89b2756c19e80a42d8a57d751f.jpg",
  "claradalmaa": "https://i.pinimg.com/736x/37/23/8c/37238c16a9f9dd2aee8b9c6ca1598926.jpg",
  "mirellapasso": "https://i.pinimg.com/736x/f9/c3/80/f9c3801a5a0bf2fee8a3b77b16ec6ea3.jpg",
  "yasmim__real": "https://i.pinimg.com/736x/c7/54/b3/c754b3e47e5863b435964159fd6d5f29.jpg",
  "dudazinhah": "https://i.pinimg.com/736x/fc/50/15/fc5015a54f037bec9b73b767c2a933bf.jpg",
  "manuelaaa.b": "https://i.pinimg.com/736x/7e/02/e1/7e02e141333a30fd05e42065584cdf2e.jpg",
  "liaa_22": "https://i.pinimg.com/736x/d5/28/ce/d528ce6e5e37d2646fbb9ecb98fc74f1.jpg",
  "viviana_oficial": "https://i.pinimg.com/1200x/65/06/bd/6506bddaace7303932eca81d0cedd441.jpg",
  "babi_doll": "https://i.pinimg.com/736x/cc/df/6c/ccdf6c718531342198378e6f308402cb.jpg",
  "helooo_priv": "https://i.pinimg.com/1200x/9d/5f/b6/9d5fb6a5d5e6b308a4be252791dc43fa.jpg",
  "luvendinha": "https://i.pinimg.com/1200x/6e/64/65/6e6465295bb3cb12ae4a82572295738e.jpg",
  "rafapezinhah": "https://i.pinimg.com/1200x/83/eb/d4/83ebd41e3b3da41b681141f8d604ec0c.jpg",
  "ninaa_real": "https://i.pinimg.com/736x/68/51/25/685125834336b85f9d108349fd9a77b3.jpg",
  "miareal": "https://i.pinimg.com/736x/16/3d/40/163d40c2ecb2e13b155a110f492db84d.jpg",
  "dani_creator": "https://i.pinimg.com/736x/a2/e4/c9/a2e4c95c9be35a4c4a9ac7cc935f93bb.jpg",
};

function avatarUrl(name: string) {
  if (AVATAR_URLS[name]) return AVATAR_URLS[name];
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffd5dc,ffdfbf,d1d4f9,c0aede,b6e3f4,fde68a,fecaca`;
}

function nameColor(name: string) {
  const colors = ["text-pink-600", "text-purple-600", "text-amber-600", "text-emerald-600", "text-sky-600", "text-rose-600", "text-indigo-600", "text-fuchsia-600"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return colors[hash % colors.length];
}

function formatRelative(minutes: number): string {
  if (minutes < 1) return "agora";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Há 1 hora";
  if (hours < 24) return `Há ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Há 1 dia";
  return `Há ${days} dias`;
}

type Thread = { root: Msg; replies: Msg[]; };

function buildThreads(messages: Msg[]): Thread[] {
  const byId = new Map<number, Msg>();
  messages.forEach((m) => byId.set(m.id, m));
  const repliesByRoot = new Map<number, Msg[]>();
  const rootIds: number[] = [];
  for (const m of messages) {
    if (m.replyTo) {
      let rootId = m.replyTo;
      let safety = 0;
      while (byId.get(rootId)?.replyTo && safety < 20) {
        rootId = byId.get(rootId)!.replyTo!;
        safety++;
      }
      if (!repliesByRoot.has(rootId)) repliesByRoot.set(rootId, []);
      repliesByRoot.get(rootId)!.push(m);
    } else {
      rootIds.push(m.id);
    }
  }
  return rootIds.map((id) => ({ root: byId.get(id)!, replies: repliesByRoot.get(id) || [] }));
}

export function ChatPanel({ userName, compact = false, hasActivePlan = false }: { userName: string; compact?: boolean; hasActivePlan?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set());
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState<"name" | "greeting">("name");
  const [chosenName, setChosenName] = useState("");
  const [userMessages, setUserMessages] = useState<Array<{ id: string; text: string; status: "sending" | "sent" | "failed" }>>([]);
  const [incomingMessages, setIncomingMessages] = useState<Array<{ name: string; text: string }>>([]);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [chatLocked, setChatLocked] = useState(false);
  const [showFakeNewMsg, setShowFakeNewMsg] = useState(false);
  const [showTwelveBadge, setShowTwelveBadge] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Direct privado da lariis: 30s apos saudacao
  const [lariisReceived, setLariisReceived] = useState(false);

  function triggerLock() {
    try { localStorage.setItem("footpriv_chat_locked", "1"); } catch {}
    setChatLocked(true);
  }

  function handleBlockedClick() {
    setToastMessage("🔒 Ative seu plano para visualizar e interagir");
    triggerLock();
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Carrega estado de bloqueio e libera se plano ativo
  useEffect(() => {
    try {
      if (hasActivePlan) {
        localStorage.removeItem("footpriv_chat_locked");
        setChatLocked(false);
        return;
      }
      const locked = localStorage.getItem("footpriv_chat_locked");
      if (locked) setChatLocked(true);
    } catch {}
  }, [hasActivePlan]);

  // Carrega mensagens persistidas (sua saudacao + 3 respostas + flags fake) ao montar
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("footpriv_chat_user_msgs");
      const savedIncoming = localStorage.getItem("footpriv_chat_incoming_msgs");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (Array.isArray(parsed)) setUserMessages(parsed);
      }
      if (savedIncoming) {
        const parsed = JSON.parse(savedIncoming);
        if (Array.isArray(parsed)) setIncomingMessages(parsed);
      }
      if (localStorage.getItem("footpriv_chat_fake_new") === "1") setShowFakeNewMsg(true);
      if (localStorage.getItem("footpriv_chat_twelve") === "1") setShowTwelveBadge(true);
      if (localStorage.getItem("footpriv_lariis_received") === "1") setLariisReceived(true);
    } catch {}
  }, []);

  // Persiste flags
  useEffect(() => {
    try {
      if (showFakeNewMsg) localStorage.setItem("footpriv_chat_fake_new", "1");
    } catch {}
  }, [showFakeNewMsg]);
  useEffect(() => {
    try {
      if (showTwelveBadge) localStorage.setItem("footpriv_chat_twelve", "1");
    } catch {}
  }, [showTwelveBadge]);

  // Salva mensagens da usuaria sempre que mudam
  useEffect(() => {
    try {
      if (userMessages.length > 0) {
        // So salva mensagens "sent" (nao salva "sending" pra nao ficar com loading no reload)
        const toSave = userMessages.filter(m => m.status !== "sending");
        if (toSave.length > 0) {
          localStorage.setItem("footpriv_chat_user_msgs", JSON.stringify(toSave));
        }
      }
    } catch {}
  }, [userMessages]);

  // Salva mensagens recebidas sempre que mudam
  useEffect(() => {
    try {
      if (incomingMessages.length > 0) {
        localStorage.setItem("footpriv_chat_incoming_msgs", JSON.stringify(incomingMessages));
      }
    } catch {}
  }, [incomingMessages]);

  // Online dinamico (110-142, oscila a cada 60s)
  const [onlineCount, setOnlineCount] = useState(() => 110 + Math.floor(Math.random() * 33));
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 a +2
        const next = prev + delta;
        if (next < 110) return 110;
        if (next > 142) return 142;
        return next;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("footpriv_chat_username");
      const seen = localStorage.getItem("footpriv_chat_welcomed");
      if (saved) setChosenName(saved);
      if (!seen) setShowWelcome(true);
    } catch {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [userMessages, incomingMessages, typingNames]);

  const firstName = (userName || "Amiga").split(/\s+/)[0];

  const threads = buildThreads(MESSAGES);

  function toggleThread(id: number) {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pickRandomResponders(): string[] {
    const allCreators = Array.from(new Set(MESSAGES.map((m) => m.name)));
    const shuffled = [...allCreators].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  const WELCOME_REPLIES = [
    "olaaaa 🌸",
    "oi",
    "bem vinda, se vc eh louca aqui no grupo vc vai ficar mais kkkk",
    "ooi, q legal mais uma chegando 🎉",
    "ola, ja se acostuma rapido aqui",
    "oi, fica a vontade",
    "bem vinda, qq coisa pergunta",
    "oi, mais uma!",
    "olaaa, prazer",
    "oi querida, q bom ter mais gente",
    "bem vinda, prepara o coraçao kkk a galera é muito doida",
    "oiii, q delicia mais uma nova",
    "oi, td bem? bem vinda",
    "olá!",
    "oi, parabens pela decisao",
    "bem vinda flor, conta com a gente",
    "ooi, espero q vc curta o grupo",
    "olá amg, sucesso 💼",
  ];

  function pickRandomReplies(n: number): string[] {
    const shuffled = [...WELCOME_REPLIES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  function handleConfirmName() {
    const name = chosenName.trim();
    if (!name) return;
    try { localStorage.setItem("footpriv_chat_username", name); } catch {}
    setWelcomeStep("greeting");
  }

  function handleSendWelcome(text: string) {
    const msgId = `user-${Date.now()}`;
    setUserMessages((prev) => [...prev, { id: msgId, text, status: "sending" }]);
    setShowWelcome(false);
    try { localStorage.setItem("footpriv_chat_welcomed", "1"); } catch {}

    setTimeout(() => {
      setUserMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, status: "sent" } : m)));
    }, 1000);

    // Respostas FIXAS na ordem (3 creators aleatorias, mensagens fixas, tempos fixos)
    const responders = pickRandomResponders();
    const fixedReplies = [
      { text: "oiii, q delicia mais uma nova", delay: 7000 },
      { text: "oii", delay: 12000 },
      { text: "mais uma pro clube das loucas, bem vinda e bora faturar 🔥", delay: 16000 },
    ];

    responders.forEach((name, i) => {
      const { text: replyText, delay } = fixedReplies[i];
      setTimeout(() => {
        setTypingNames((prev) => [...prev, name]);
      }, delay - 2000);
      setTimeout(() => {
        setTypingNames((prev) => prev.filter((n) => n !== name));
        setIncomingMessages((prev) => [...prev, { name, text: replyText }]);
      }, delay);
    });

    // Apos a 3a resposta: trava em 500ms. +12 aparece 40s depois.
    const lastDelay = fixedReplies[fixedReplies.length - 1].delay;
    setTimeout(() => {
      triggerLock();
    }, lastDelay + 500);
    setTimeout(() => {
      setShowTwelveBadge(true);
    }, lastDelay + 40000);

    // Direct privado da lariis: 30s apos a saudacao inicial
    setTimeout(() => {
      try { localStorage.setItem("footpriv_lariis_received", "1"); } catch {}
      setLariisReceived(true);
    }, 30000);
  }

  function handleDraftSend() {
    if (!draftMessage.trim()) return;
    // Tentar enviar mensagem nova trava o chat imediatamente (nao envia)
    setDraftMessage("");
    triggerLock();
    setToastMessage("🔒 Ative seu plano para enviar mensagens");
    setTimeout(() => setToastMessage(null), 3500);
  }

  function renderMessage(m: Msg, isReply = false) {
    return (
      <div key={m.id} className={`flex items-start gap-2 ${isReply ? "ml-8 mt-1.5" : ""}`}>
        <img src={avatarUrl(m.name)} alt={m.name} className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200 object-cover" />
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-gray-100 inline-block max-w-full">
            <p className={`text-[11px] font-bold ${nameColor(m.name)} mb-0.5`}>{m.name}</p>
            <p className="text-sm text-gray-800 leading-snug whitespace-pre-wrap break-words">{m.text}</p>
            <p className="text-[9px] text-gray-400 text-right mt-1">{formatRelative(m.minutesAgo)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col ${compact ? "h-[480px] rounded-2xl border border-gray-200 overflow-hidden" : "h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)]"} bg-gray-50`}>
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <img src="https://i.pinimg.com/736x/18/57/b0/1857b072b8d6070ea49173879fc47de7.jpg" alt="Foot Priv" className="w-10 h-10 rounded-full object-cover shadow flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-sm truncate">Chat público de creators</h2>
          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            {onlineCount} online · comunidade BR
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Ver mensagens mais antigas (sempre visivel no topo) */}
        <button
          onClick={handleBlockedClick}
          className="w-full text-center py-2.5 text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-1.5 mb-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          Ver mensagens mais antigas
        </button>

        {threads.map((thread) => {
          const totalReplies = thread.replies.length;
          const expanded = expandedThreads.has(thread.root.id);
          const visibleReplies = totalReplies <= 2 || expanded ? thread.replies : thread.replies.slice(0, 2);
          const hiddenCount = totalReplies - visibleReplies.length;
          return (
            <div key={thread.root.id}>
              {renderMessage(thread.root)}
              {visibleReplies.map((r) => renderMessage(r, true))}
              {hiddenCount > 0 && (
                <button onClick={() => toggleThread(thread.root.id)} className="ml-8 mt-1 text-[11px] text-pink-600 font-semibold hover:text-pink-700 transition flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  ver mais {hiddenCount} {hiddenCount === 1 ? "resposta" : "respostas"}
                </button>
              )}
              {expanded && totalReplies > 2 && (
                <button onClick={() => toggleThread(thread.root.id)} className="ml-8 mt-1 text-[11px] text-gray-500 font-semibold hover:text-gray-700 transition">
                  ocultar respostas
                </button>
              )}
            </div>
          );
        })}


        {userMessages.map((m) => (
          <div key={m.id} className="flex items-start gap-2 flex-row-reverse">
            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
              {(chosenName || userName || "U").substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 flex flex-col items-end">
              <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm border border-pink-200 inline-block max-w-[85%]">
                <p className="text-[11px] font-bold text-pink-700 mb-0.5">Você</p>
                <p className="text-sm text-gray-800 leading-snug whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`text-[9px] text-right mt-1 ${m.status === "failed" ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                  {m.status === "sending" ? (
                    <span className="flex items-center gap-1 justify-end">
                      <svg className="w-2.5 h-2.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      enviando...
                    </span>
                  ) : m.status === "failed" ? (
                    <span className="flex items-center gap-1 justify-end">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Aguarde seu leilão finalizar para enviar uma mensagem
                    </span>
                  ) : (
                    "agora"
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}



        {/* Mensagens recebidas das creators ficticias */}
        {incomingMessages.map((m, i) => (
          <div key={`inc-${i}`} className="flex items-start gap-2">
            <img src={avatarUrl(m.name)} alt={m.name} className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200 object-cover" />
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-gray-100 inline-block max-w-full">
                <p className={`text-[11px] font-bold ${nameColor(m.name)} mb-0.5`}>{m.name}</p>
                <p className="text-sm text-gray-800 leading-snug whitespace-pre-wrap break-words">{m.text}</p>
                <p className="text-[9px] text-gray-400 text-right mt-1">agora</p>
              </div>
            </div>
          </div>
        ))}

        {/* Indicador "fulana esta digitando..." */}
        {typingNames.map((name) => (
          <div key={`typing-${name}`} className="flex items-start gap-2">
            <img src={avatarUrl(name)} alt={name} className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200 object-cover" />
            <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-gray-100 inline-flex items-center gap-1.5">
              <span className={`text-[11px] font-bold ${nameColor(name)}`}>{name}</span>
              <span className="text-[11px] text-gray-500">está digitando</span>
              <span className="flex gap-0.5 ml-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
            </div>
          </div>
        ))}

        {/* +12 novas mensagens (discreto, no rodape, 40s apos trava) */}
        {showTwelveBadge && (
          <button
            onClick={handleBlockedClick}
            className="w-full text-center py-2 text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            +12 novas mensagens · ative para ver
          </button>
        )}

      </div>

      {showWelcome ? (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
          {welcomeStep === "name" ? (
            <>
              <p className="text-sm font-bold text-gray-900 mb-1">👋 Como você quer ser chamada?</p>
              <p className="text-[11px] text-gray-500 mb-3">Esse será seu nome no chat (pode ser apelido)</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2.5 border border-gray-200">
                <input
                  type="text"
                  placeholder="Digite seu nome ou apelido..."
                  value={chosenName}
                  onChange={(e) => setChosenName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleConfirmName(); }}
                  maxLength={20}
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                />
                <button
                  onClick={handleConfirmName}
                  disabled={!chosenName.trim()}
                  className="text-pink-600 disabled:text-gray-300 transition font-semibold text-sm px-2"
                >
                  Continuar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-900 mb-1">👋 Apresente-se ao grupo!</p>
              <p className="text-[11px] text-gray-500 mb-3">Escolha uma forma de começar:</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSendWelcome(`Olá, me chamo ${chosenName}`)}
                  className="text-left text-sm bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl px-3 py-2.5 transition active:scale-98"
                >
                  👋 Olá, me chamo {chosenName}
                </button>
                <button
                  onClick={() => handleSendWelcome(`Olá, me chamo ${chosenName} e sou nova por aqui`)}
                  className="text-left text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl px-3 py-2.5 transition active:scale-98"
                >
                  ✨ Olá, me chamo {chosenName} e sou nova por aqui
                </button>
                <button
                  onClick={() => handleSendWelcome(`Me chamo ${chosenName} e estou feliz por ser uma nova creator`)}
                  className="text-left text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl px-3 py-2.5 transition active:scale-98"
                >
                  🌷 Me chamo {chosenName} e estou feliz por ser uma nova creator
                </button>
              </div>
            </>
          )}
        </div>
      ) : chatLocked ? (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-gray-600 text-center">Somente creators ativas podem enviar mensagens — ative seu plano para interagir</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border-t border-gray-200 px-3 py-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2.5 border border-gray-200">
            <input
              type="text"
              placeholder="Escreva uma mensagem..."
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleDraftSend(); }}
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            <button onClick={handleDraftSend} disabled={!draftMessage.trim()} className="text-pink-600 disabled:text-gray-300 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
