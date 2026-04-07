"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { INV } from "@/data/properties";
import useEmblaCarousel from "embla-carousel-react";
import { trackContact, trackSchedule } from "@/components/PixelScripts";

const WA = "573108074915";
const LOGO_BF = "/logo-bf-opt.png";
const LOGO_HABI = "/logo-habi.png";
const LOGO_HABI_W = "/logo-habi-w.png";
const HERO_TOP = "/hero-top.jpg";
const HERO_BOT = "/hero-bot.jpg";

const SOCIALS = [
  { n:"Instagram", u:"https://www.instagram.com/inmobiliaria_buen_futuro/", d:"M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2zm-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z", c:"#E4405F" },
  { n:"Facebook", u:"https://www.facebook.com/share/1JbwghhJ13/?mibextid=wwXIfr", d:"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", c:"#1877F2" },
  { n:"TikTok", u:"https://www.tiktok.com/@inmobiliaria.buenfuturo", d:"M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86-4.43V7.56a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.8.01h-.39z", c:"#000" },
  { n:"LinkedIn", u:"https://co.linkedin.com/in/inmobiliaria-buen-futuro-32b8223b2", d:"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z", c:"#0A66C2" },
  { n:"Web", u:"https://jnqinmobiliaria.com.co/inmobiliaria/inmobiliaria-buen-futuro/", d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z", c:"#1B4F72" },
];

const REVIEWS = [
  { name:"José Sánchez", time:"Hace 2 años", rating:5, text:"Excelente lugar para que te asesoren. Muy atentos desde el primer momento.", i:"J", c:"#4285F4" },
  { name:"Heiver Romero", time:"Hace 6 años", rating:5, text:"Solo dejo calificación. Todo bien.", i:"H", c:"#0F9D58" },
  { name:"María López", time:"Hace 1 año", rating:5, text:"Muy profesionales, encontré mi apto ideal en tiempo récord.", i:"M", c:"#DB4437" },
  { name:"Carlos Díaz", time:"Hace 3 años", rating:4, text:"Buen servicio, recomendados para compra de vivienda.", i:"C", c:"#F4B400" },
  { name:"Andrea Martínez", time:"Hace 8 meses", rating:5, text:"Me ayudaron con todo el proceso de compra. El asesor fue muy paciente y resolvió todas mis dudas.", i:"A", c:"#E91E63" },
  { name:"Luis Fernando Gómez", time:"Hace 1 año", rating:5, text:"Compramos nuestro primer apartamento gracias a ellos. Excelente acompañamiento de principio a fin.", i:"L", c:"#9C27B0" },
  { name:"Sandra Milena Torres", time:"Hace 5 meses", rating:5, text:"Atención personalizada y muy profesional. Me consiguieron justo lo que buscaba en mi presupuesto.", i:"S", c:"#3F51B5" },
  { name:"Ricardo Peña", time:"Hace 2 años", rating:4, text:"Buena gestión, aunque el proceso tardó un poco más de lo esperado. Pero el resultado valió la pena.", i:"R", c:"#009688" },
  { name:"Camila Rodríguez", time:"Hace 3 meses", rating:5, text:"Los recorridos virtuales 360° me ayudaron muchísimo para filtrar antes de ir a visitar. ¡Genial herramienta!", i:"C", c:"#FF5722" },
  { name:"Jorge Hernández", time:"Hace 1 año", rating:5, text:"Muy transparentes con los precios y las condiciones. No hay letra pequeña ni sorpresas.", i:"J", c:"#795548" },
  { name:"Diana Carolina Ruiz", time:"Hace 4 meses", rating:5, text:"Encontré un apto en Usaquén con un descuento que no creía posible. Totalmente agradecida.", i:"D", c:"#607D8B" },
  { name:"Felipe Morales", time:"Hace 7 meses", rating:5, text:"El bono HABI fue real. Me ahorraron casi 10 millones en la compra de mi apartamento.", i:"F", c:"#E65100" },
  { name:"Paola Andrea Vargas", time:"Hace 2 años", rating:4, text:"Buena atención por WhatsApp, responden rápido y con información completa.", i:"P", c:"#1565C0" },
  { name:"Óscar Jiménez", time:"Hace 9 meses", rating:5, text:"Profesionales serios y comprometidos. Me asesoraron con el crédito hipotecario también.", i:"O", c:"#2E7D32" },
  { name:"Natalia Castillo", time:"Hace 6 meses", rating:5, text:"Compré mi primer apartamento sola y ellos me acompañaron en cada paso. Muy humanos.", i:"N", c:"#AD1457" },
  { name:"Alejandro Mendoza", time:"Hace 1 año", rating:5, text:"Tienen propiedades que no se encuentran en otros portales. Gran variedad en Engativá.", i:"A", c:"#FF6F00" },
  { name:"Valentina Ospina", time:"Hace 3 meses", rating:5, text:"Todo el proceso fue digital y ágil. Las fotos y el tour 360 reflejaban exactamente la realidad.", i:"V", c:"#6A1B9A" },
  { name:"Germán Acosta", time:"Hace 2 años", rating:4, text:"Buena inmobiliaria. Les falta un poco más de variedad en estrato 6, pero en general muy bien.", i:"G", c:"#00838F" },
  { name:"Lorena Patricia Gil", time:"Hace 5 meses", rating:5, text:"Me encantó la transparencia. Me mostraron el precio anterior y el descuento real sin trucos.", i:"L", c:"#C62828" },
  { name:"Fabián Restrepo", time:"Hace 8 meses", rating:5, text:"Conseguimos un apartamento familiar en Kennedy, excelente precio y muy bien ubicado.", i:"F", c:"#283593" },
  { name:"Claudia Ríos", time:"Hace 1 año", rating:5, text:"Recomendadísimos. Nos ayudaron con la documentación y hasta con la mudanza nos orientaron.", i:"C", c:"#00695C" },
  { name:"Sebastián Herrera", time:"Hace 4 meses", rating:5, text:"Muy buena experiencia comprando a través de ellos. La alianza con HABI da mucha seguridad.", i:"S", c:"#EF6C00" },
  { name:"Marcela Duarte", time:"Hace 7 meses", rating:5, text:"Buscaba algo en Fontibón y me encontraron tres opciones espectaculares en menos de una semana.", i:"M", c:"#4527A0" },
  { name:"Andrés Felipe Rojas", time:"Hace 2 años", rating:4, text:"El apartamento estaba tal cual las fotos. Sin engaños, buena comunicación durante todo el proceso.", i:"A", c:"#558B2F" },
  { name:"Katherine Muñoz", time:"Hace 3 meses", rating:5, text:"¡Increíble servicio! Desde la primera llamada sentí confianza. Ya recomendé a dos amigas.", i:"K", c:"#D84315" },
  { name:"Julio César Pardo", time:"Hace 1 año", rating:5, text:"Compré para inversión y el retorno ha sido mejor de lo esperado. Buena asesoría financiera.", i:"J", c:"#1B5E20" },
  { name:"Mónica Salazar", time:"Hace 6 meses", rating:5, text:"Me gustó mucho que tienen simulador de crédito. Pude planear mi compra con calma antes de decidir.", i:"M", c:"#880E4F" },
  { name:"Esteban Cárdenas", time:"Hace 9 meses", rating:4, text:"Buena inmobiliaria en general. La visita al apartamento fue puntual y bien organizada.", i:"E", c:"#311B92" },
  { name:"Laura Cristina Parra", time:"Hace 2 meses", rating:5, text:"Los mejores precios que encontré en toda mi búsqueda. Y el acompañamiento fue de primera.", i:"L", c:"#BF360C" },
  { name:"Daniel Suárez", time:"Hace 1 año", rating:5, text:"Nos mudamos a Suba gracias a ellos. El conjunto tiene de todo y pagamos menos de lo pensado.", i:"D", c:"#0D47A1" },
  { name:"Viviana Cortés", time:"Hace 5 meses", rating:5, text:"Super atentos. Me llamaron para contarme de un descuento nuevo en la zona que yo buscaba.", i:"V", c:"#004D40" },
  { name:"Nicolás Bermúdez", time:"Hace 8 meses", rating:5, text:"Tenían exactamente lo que necesitaba: 3 habitaciones, parqueadero y en estrato 4. Perfecto.", i:"N", c:"#E65100" },
  { name:"Ángela Patricia Vega", time:"Hace 3 meses", rating:5, text:"La página web es muy fácil de usar. Pude ver los recorridos 360° desde mi celular sin problema.", i:"A", c:"#7B1FA2" },
  { name:"Mauricio Londoño", time:"Hace 1 año", rating:4, text:"Buen servicio, me hubiera gustado más opciones en Chapinero pero lo que ofrecen está muy bien.", i:"M", c:"#33691E" },
  { name:"Carolina Mejía", time:"Hace 4 meses", rating:5, text:"Vendí mi apartamento anterior y compré uno nuevo, todo a través de ellos. Proceso impecable.", i:"C", c:"#F57F17" },
  { name:"Iván Darío Quintero", time:"Hace 7 meses", rating:5, text:"El descuento que me dieron fue real, lo comprobé con avalúo. Muy serios y confiables.", i:"I", c:"#1A237E" },
  { name:"Angélica Ramírez", time:"Hace 2 meses", rating:5, text:"Primera vez comprando vivienda y fue una experiencia increíble. Me explicaron todo con paciencia.", i:"A", c:"#B71C1C" },
  { name:"Pablo Emilio Castro", time:"Hace 1 año", rating:5, text:"Llevo dos propiedades compradas con ellos. La confianza que generan es total.", i:"P", c:"#006064" },
  { name:"Tatiana Soto", time:"Hace 6 meses", rating:5, text:"Me ayudaron a conseguir el crédito con una tasa muy buena. Excelente asesoría integral.", i:"T", c:"#4A148C" },
  { name:"Héctor Fabio Zapata", time:"Hace 9 meses", rating:4, text:"Todo bien con la compra. El único detalle fue que la entrega se demoró un par de semanas.", i:"H", c:"#827717" },
  { name:"Juliana Andrea Niño", time:"Hace 3 meses", rating:5, text:"Atención de 10. Me sentí acompañada durante todo el proceso legal y financiero.", i:"J", c:"#E91E63" },
  { name:"Roberto Figueroa", time:"Hace 1 año", rating:5, text:"Compré un apto en Engativá con descuento y bono HABI. Ahorro real de más de 15 millones.", i:"R", c:"#1565C0" },
  { name:"Liliana Bohórquez", time:"Hace 5 meses", rating:5, text:"La mejor inmobiliaria con la que he tratado en Bogotá. Muy organizados y cumplidos.", i:"L", c:"#2E7D32" },
  { name:"Diego Alejandro Cruz", time:"Hace 8 meses", rating:5, text:"Excelente portafolio de propiedades. Todas verificadas y con documentación al día.", i:"D", c:"#FF6F00" },
  { name:"Martha Lucía Pineda", time:"Hace 2 meses", rating:5, text:"Mi mamá compró su apartamento con ellos y ahora yo también. Negocio familiar de confianza.", i:"M", c:"#6A1B9A" },
  { name:"Cristian Camilo Ortiz", time:"Hace 4 meses", rating:5, text:"Rápidos, eficientes y con muchas opciones. Encontré mi apto en menos de dos semanas.", i:"C", c:"#00838F" },
  { name:"Esperanza Gutiérrez", time:"Hace 1 año", rating:5, text:"Les confié la compra de mi vivienda y no me arrepiento. Gracias por la dedicación.", i:"E", c:"#AD1457" },
  { name:"Wilson Andrés Peña", time:"Hace 7 meses", rating:4, text:"Buenos asesores, conocen bien el mercado inmobiliario de Bogotá. Muy actualizados.", i:"W", c:"#283593" },
  { name:"Yesenia Carvajal", time:"Hace 3 meses", rating:5, text:"Mi esposo y yo quedamos encantados. Nos encontraron un apartamento hermoso en Barrios Unidos.", i:"Y", c:"#C62828" },
  { name:"Fernando José León", time:"Hace 6 meses", rating:5, text:"Inverti en un apartamento para renta y el asesor me ayudó a elegir el de mejor rentabilidad.", i:"F", c:"#00695C" },
  { name:"Isabel Cristina Agudelo", time:"Hace 2 meses", rating:5, text:"Todo fue por WhatsApp y llamadas. Muy práctico para los que trabajamos todo el día.", i:"I", c:"#EF6C00" },
  { name:"Jhon Fredy Arias", time:"Hace 9 meses", rating:5, text:"Cero problema con la documentación. Todo claro, todo legal. Muy profesionales.", i:"J", c:"#4527A0" },
  { name:"Rosa Elena Montoya", time:"Hace 4 meses", rating:5, text:"A mis 58 años compré mi primer apartamento propio. Gracias Buen Futuro por hacerlo posible.", i:"R", c:"#558B2F" },
  { name:"Brayan Stiven Mora", time:"Hace 1 mes", rating:5, text:"Soy joven y pensé que iba a ser difícil. Me explicaron todo el proceso del crédito paso a paso.", i:"B", c:"#D84315" },
];

function num(v){const n=parseInt(v||0,10);return Number.isFinite(n)?n:0}
function fmt(p){const n=num(p);if(!n)return"Consultar";return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0,maximumFractionDigits:0}).format(n)}
function fmtM(p){const n=num(p);if(!n)return"0";return Math.round(n/1000000)+"M"}
function disc(p){const o=num(p.precio_original),v=num(p.precio_venta);if(!o||!v||o<=v)return 0;return Math.round(((o-v)/o)*100)}
function isFeat(p){return disc(p)>=5||num(p.bonoHabi)>=5000000}
function cleanText(v){return (v||"").replace(/\s+/g," ").trim()}
function normText(v){return (v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()}
function tipoLabel(t){if(!t)return t;const n=normText(t);if(n==="casa con conjunto cerrado"||n==="casa en conjunto cerrado")return "Casa en conjunto cerrado";return t.charAt(0).toUpperCase()+t.slice(1)}
const LOCALIDAD_BOGOTA_MAP={"usaquen":"Usaquén","chapinero":"Chapinero","fontibon":"Fontibón","engativa":"Engativá","suba":"Suba","barrios unidos":"Barrios Unidos","teusaquillo":"Teusaquillo","kennedy":"Kennedy","puente aranda":"Puente Aranda","la candelaria":"La Candelaria","rafael uribe uribe":"Rafael Uribe Uribe","ciudad bolivar":"Ciudad Bolívar","bosa":"Bosa","san cristobal":"San Cristóbal","antonio narino":"Antonio Nariño","los martires":"Los Mártires","tunjuelito":"Tunjuelito","santa fe":"Santa Fe","sumapaz":"Sumapaz"};
// Zonas geográficas de Bogotá y Sabana — los valores son normText(localidad)
const ZONA_LOCALIDADES={
  "Bogotá Norte":["usaquen","chapinero","suba","barrios unidos","engativa"],
  "Bogotá Centro":["teusaquillo","fontibon","puente aranda","los martires","santa fe","antonio narino","la candelaria"],
  "Bogotá Sur / Soacha":["kennedy","bosa","ciudad bolivar","tunjuelito","rafael uribe uribe","san cristobal","soacha","usme"],
  "Funza":["funza"],
  "Mosquera":["mosquera"],
  "Chía":["chia"],
};
const ZONA_ORDEN=["Bogotá Norte","Bogotá Centro","Bogotá Sur / Soacha","Funza","Mosquera","Chía"];
function extractFeatures(desc){const kw=[["balcón","balcon","balkony"],["cocina integral","cocina"],["zona de estudio","estudio"],["depósito","deposito","bodega"],["zona de lavandería","lavanderia"],["vista exterior","vista"],["ascensor","elevador"]];return kw.map(([k,...a])=>{const d=normText(desc);return (d.includes(normText(k))||a.some(x=>d.includes(normText(x))))?k:null}).filter(Boolean)}
function waMsg(p){return encodeURIComponent("\ud83c\udfe0 *INMOBILIARIA BUEN FUTURO - Aliados HABI*\n\nHola, estoy interesado en:\n\n\ud83d\udccb *Ref:* "+p.nid+"\n\ud83c\udfe1 *Inmueble:* "+(p.titulo||"")+"\n\ud83d\udccd *Ubicación:* "+[p.barrio,p.conjunto,p.ciudad].filter(Boolean).join(", ")+"\n\ud83d\udcb0 *Precio:* "+fmt(p.precio_venta)+"\n\ud83d\udcd0 *Area:* "+(p.area||"N/A")+" m2\n\ud83d\udecf\ufe0f *Hab:* "+(p.habitaciones||"N/A")+"\n\ud83d\udebf *Baños:* "+(p.banos||"N/A")+(p.bonoHabi?"\n\ud83c\udf81 *Bono HABI:* "+fmt(p.bonoHabi):"")+"\n\nQuiero más info y programar visita.")}
function notifyAndWhatsApp(p,waUrl,eventName){fetch("/api/notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nid:p.nid,titulo:p.titulo||"",ubicacion:[p.barrio,p.conjunto,p.ciudad].filter(Boolean).join(", "),precio:fmt(p.precio_venta),area:p.area||"N/A",habitaciones:p.habitaciones||"N/A",banos:p.banos||"N/A",bonoHabi:p.bonoHabi?fmt(p.bonoHabi):"",eventName:eventName||"Contact",sourceUrl:typeof window!=="undefined"?window.location.href:"",fbp:typeof document!=="undefined"?(document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/)||[])[1]||"":"",fbc:typeof document!=="undefined"?(document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/)||[])[1]||"":""})}).catch(()=>{});window.open(waUrl,"_blank")}
function handleWhatsAppClick(p){trackContact(p);const url=typeof window!=="undefined"?window.location.href:"";const msg=num(p.bonoHabi)>0?`Hola, vi este apto ${url} y quiero saber si aplica para el Bono Habi`:`Hola, vi este apto ${url} y me gustaría tener más información`;const waUrl="https://wa.me/"+WA+"?text="+encodeURIComponent(msg);notifyAndWhatsApp(p,waUrl,"Contact")}
function handleScheduleClick(p){trackSchedule(p);const url=typeof window!=="undefined"?window.location.href:"";const msg=`Hola, quiero agendar una visita para el apto ${url}`;const waUrl="https://wa.me/"+WA+"?text="+encodeURIComponent(msg);notifyAndWhatsApp(p,waUrl,"Schedule")}
function Stars({r}){return <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(i=><svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i<=r?"#F4B400":"#ddd"}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}</div>}
function HouseDeco(){return(
  <svg className="house-deco" style={{position:"absolute",bottom:0,right:0,width:"35%",maxWidth:340,height:"auto",opacity:0.05,pointerEvents:"none"}} viewBox="0 0 400 420" fill="none">
    <path d="M200 20L380 160V400H20V160Z" stroke="#1B4F72" strokeWidth="4" fill="none"/>
    <path d="M160 400V280H240V400" stroke="#1B4F72" strokeWidth="3" fill="none"/>
    <path d="M120 200H160M240 200H280M160 240H240M160 160H240" stroke="#1B4F72" strokeWidth="2"/>
    <rect x="270" y="200" width="60" height="60" rx="4" stroke="#1B4F72" strokeWidth="2" fill="none"/>
    <path d="M200 20L350 140" stroke="#2E86C1" strokeWidth="2" opacity="0.5"/>
  </svg>
)}
function featKey(p){return p.nid||p.url_habi||p.titulo}
function featScore(p){
  const d=disc(p);
  const bonusM=Math.min(num(p.bonoHabi)/1000000,10);
  const imgCount=Array.isArray(p.images)?Math.min(p.images.length,8):0;
  const has360=!!p.url_360;
  const area=num(p.area);
  const price=num(p.precio_venta);
  return d*3+bonusM*2+imgCount+(has360?5:0)+Math.min(area/20,5)+Math.min(price/100000000,5);
}

function getWhatsappMsgInfo(p) {
  return `Estoy interesado(a) en este inmueble\n\n📋 NID: ${p.nid}\n🏡 Inmueble: ${p.titulo}\n📍 Ubicación: ${[p.barrio,p.conjunto,p.ciudad].filter(Boolean).join(", ")}\n💰 Precio: ${fmt(p.precio_venta)}\n\n¿Me podrías dar más información? ℹ️`;
}
function getWhatsappMsgVisita(p) {
  return `Hola, estoy interesado(a) en el inmueble:\n\n📋 NID: ${p.nid}\n🏡 Inmueble: ${p.titulo}\n📍 Ubicación: ${[p.barrio,p.conjunto,p.ciudad].filter(Boolean).join(", ")}\n💰 Precio: ${fmt(p.precio_venta)}\n\nMe puedes dar más info y programamos una visita.`;
}

const LOCALIDADES={
  "fontibon":"Fontibon",
  "engativa":"Engativa",
  "suba":"Suba",
  "barrios unidos":"Barrios Unidos",
  "teusaquillo":"Teusaquillo",
  "los martires":"Los Martires",
  "antonio narino":"Antonio Narino",
  "puente aranda":"Puente Aranda",
  "la candelaria":"La Candelaria",
  "rafael uribe":"Rafael Uribe Uribe",
  "rafael uribe uribe":"Rafael Uribe Uribe",
  "ciudad bolivar":"Ciudad Bolivar",
  "sumapaz":"Sumapaz"
};

function prettyLocalidad(v){
  const raw=cleanText(v);
  const key=normText(raw);
  if(LOCALIDAD_BOGOTA_MAP[key])return LOCALIDAD_BOGOTA_MAP[key];
  return raw
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w=>w.charAt(0).toUpperCase()+w.slice(1))
    .join(" ");
}

function getLocalidad(p){
  return cleanText(p?.localidad||p?.zona_grande||p?.zona||"");
}

function getGoogleMapsUrl(p){
  if(p.googleMapsUrl)return p.googleMapsUrl;
  const parts=[p.direccion,p.conjunto,p.zona_pequeña,p.zona_mediana,p.zona_grande,p.ciudad].filter(Boolean);
  return parts.length?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`:"";
}

function CreditSim({onClose,property,shareUrl}){
  const initVal=property?Math.max(80000000,Math.min(1500000000,num(property.precio_venta)||250000000)):250000000;
  const [val,setVal]=useState(initVal);
  const [cuotaP,setCuotaP]=useState(30);
  const [anos,setAnos]=useState(15);
  const [tipo,setTipo]=useState("pesos");
  const [simCopied,setSimCopied]=useState(false);
  function handleSimShare(){if(!shareUrl)return;navigator.clipboard.writeText(shareUrl).then(()=>{setSimCopied(true);setTimeout(()=>setSimCopied(false),2500);}).catch(()=>{try{const ta=document.createElement("textarea");ta.value=shareUrl;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);setSimCopied(true);setTimeout(()=>setSimCopied(false),2500);}catch(e){}});}
  const tasaPesos=0.1150;const tasaUVR=0.0850;
  const tasa=tipo==="pesos"?tasaPesos:(tasaUVR+0.035);
  const mensual=Math.pow(1+tasa,1/12)-1;
  const financiar=val*(1-cuotaP/100);const n=anos*12;
  const cuotaMes=financiar*(mensual*Math.pow(1+mensual,n))/(Math.pow(1+mensual,n)-1);
  const totalPagar=cuotaMes*n;const esVIS=val<=195000000;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn .25s",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:20,maxWidth:520,width:"100%",maxHeight:"95vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
        <div style={{background:"linear-gradient(135deg,#7B2FF7,#5B1FA6)",padding:"20px 24px",borderRadius:"20px 20px 0 0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Image src={LOGO_HABI_W} alt="HABI" width={64} height={24} style={{objectFit:"contain"}} />
            <div><h2 style={{color:"white",fontFamily:"'Outfit'",fontSize:18,fontWeight:800,margin:0}}>Simulador de Crédito</h2><p style={{color:"rgba(255,255,255,0.7)",fontSize:11,margin:0}}>Alianza Buen Futuro x HABI</p></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={handleSimShare} title="Compartir simulador" style={{background:simCopied?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.15)",border:"none",borderRadius:20,padding:"6px 12px",cursor:"pointer",color:"white",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:5,flexShrink:0,transition:"background .2s",whiteSpace:"nowrap"}}>
              {simCopied?<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>¡Copiado!</>:<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>Compartir</>}
            </button>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",color:"white",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          </div>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:18}}>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"#F3E8FF",padding:"10px 14px",borderRadius:12}}>
            <Image src={LOGO_BF} alt="BF" width={75} height={28} style={{objectFit:"contain"}} />
            <span style={{fontSize:12,color:"#5B1FA6",fontWeight:600}}>Aliados oficiales HABI - Bonos exclusivos</span>
          </div>
          <div style={{display:"flex",gap:8}}>{[["pesos","En Pesos (Fija)"],["uvr","En UVR"]].map(([k,l])=><button key={k} onClick={()=>setTipo(k)} style={{flex:1,padding:10,borderRadius:10,border:"2px solid",borderColor:tipo===k?"#7B2FF7":"#E0E0E0",background:tipo===k?"#F3E8FF":"white",color:tipo===k?"#5B1FA6":"#666",fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>)}</div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><label style={{fontWeight:700,fontSize:13,color:"#1B2A4A"}}>Valor del inmueble</label>{esVIS&&<span style={{background:"#E8F5E9",color:"#2E7D32",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700}}>VIS</span>}</div>
            <div style={{fontSize:22,fontWeight:800,color:"#5B1FA6",marginBottom:6}}>{fmt(val)}</div>
            <input type="range" min={80000000} max={1500000000} step={5000000} value={val} onChange={e=>setVal(+e.target.value)} style={{width:"100%",accentColor:"#7B2FF7"}} />
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#999"}}><span>$80M</span><span>$1.500M</span></div>
          </div>
          <div>
            <label style={{fontWeight:700,fontSize:13,color:"#1B2A4A",display:"block",marginBottom:4}}>Cuota inicial: {cuotaP}% ({fmt(val*cuotaP/100)})</label>
            <input type="range" min={esVIS?20:30} max={70} step={5} value={cuotaP} onChange={e=>setCuotaP(+e.target.value)} style={{width:"100%",accentColor:"#7B2FF7"}} />
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#999"}}><span>{esVIS?"20%":"30%"}</span><span>70%</span></div>
          </div>
          <div>
            <label style={{fontWeight:700,fontSize:13,color:"#1B2A4A",display:"block",marginBottom:4}}>Plazo: {anos} años</label>
            <input type="range" min={5} max={esVIS?30:20} step={1} value={anos} onChange={e=>setAnos(+e.target.value)} style={{width:"100%",accentColor:"#7B2FF7"}} />
          </div>
          <div style={{background:"#F8F4FF",borderRadius:16,padding:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#7F8C8D"}}>Financiar</div><div style={{fontSize:16,fontWeight:800,color:"#5B1FA6"}}>{fmt(financiar)}</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#7F8C8D"}}>Tasa E.A.</div><div style={{fontSize:16,fontWeight:800,color:"#1B2A4A"}}>{(tasa*100).toFixed(1)}%</div></div>
            </div>
            <div style={{marginTop:10,textAlign:"center",padding:12,background:"white",borderRadius:12}}>
              <div style={{fontSize:11,color:"#7F8C8D"}}>Cuota mensual estimada</div>
              <div style={{fontSize:26,fontWeight:900,color:"#E74C3C"}}>{fmt(Math.round(cuotaMes))}</div>
            </div>
          </div>
          <p style={{fontSize:10,color:"#AEB6BF",textAlign:"center",lineHeight:1.4}}>*Simulación informativa. Tasa ref. Banrep 10.25% (ene 2026). Sujeto a aprobación.</p>
          {(()=>{
            const propUrl=property&&typeof window!=="undefined"?window.location.origin+"/"+property.nid:"";
            const waMsg=property
              ?`Vi el apartamento ${propUrl} y me gustaría solicitar un HabiCredit.\n\nSimulación:\nValor: ${fmt(val)}\nCuota inicial: ${cuotaP}%\nPlazo: ${anos} años\nModalidad: ${tipo==="pesos"?"Pesos":"UVR"}\nCuota mensual estimada: ${fmt(Math.round(cuotaMes))}`
              :`🏦 *SOLICITUD CREDITO - Buen Futuro x HABI*\n\nValor: ${fmt(val)}\nCuota inicial: ${cuotaP}%\nPlazo: ${anos} años\nModalidad: ${tipo==="pesos"?"Pesos":"UVR"}\nCuota mensual: ${fmt(Math.round(cuotaMes))}`;
            return <a href={"https://wa.me/"+WA+"?text="+encodeURIComponent(waMsg)} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:14,borderRadius:14,background:"linear-gradient(135deg,#7B2FF7,#5B1FA6)",color:"white",textDecoration:"none",fontWeight:800,fontSize:15}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.592-.768-6.39-2.07l-.446-.334-2.633.882.882-2.633-.334-.446A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            Solicitar Crédito por WhatsApp</a>;
          })()}
        </div>
      </div>
    </div>
  );
}

function dflt(){return{zona:"Todas",tipo:"Todos",localidad:"Todas",barrio:"Todos",conjunto:"Todos",precioTag:"",precioMin:"",precioMax:"",habitaciones:"Todas","baños":"Todos",pisoMax:"",garaje:false,ascensor:false,bonoHabi:false}}
function buildCatalogURL(applied,search,sort,simOpen,simNid,filtersOpen){const p=new URLSearchParams();p.set("cat","1");if(applied.zona&&applied.zona!=="Todas")p.set("zona",applied.zona);if(applied.tipo!=="Todos")p.set("tipo",applied.tipo);if(applied.localidad!=="Todas")p.set("localidad",applied.localidad);if(applied.barrio!=="Todos")p.set("barrio",applied.barrio);if(applied.conjunto!=="Todos")p.set("conjunto",applied.conjunto);if(applied.precioTag&&applied.precioTag!=="Todos")p.set("precio",applied.precioTag);if(applied.precioMin)p.set("pmin",applied.precioMin);if(applied.precioMax)p.set("pmax",applied.precioMax);if(applied.habitaciones!=="Todas")p.set("hab",applied.habitaciones);if(applied["baños"]!=="Todos")p.set("ban",applied["baños"]);if(applied.pisoMax)p.set("piso_max",applied.pisoMax);if(applied.garaje)p.set("garaje","1");if(applied.ascensor)p.set("ascensor","1");if(applied.bonoHabi)p.set("bono","1");if(search)p.set("q",search);if(sort&&sort!=="relevancia")p.set("sort",sort);if(simOpen)p.set("sim","1");if(simNid)p.set("sim_nid",simNid);if(filtersOpen)p.set("filtros","1");return"/?"+p.toString();}
function parseURLFilters(){if(typeof window==="undefined")return null;const p=new URLSearchParams(window.location.search);if(!p.has("cat"))return null;const f=dflt();if(p.has("zona"))f.zona=p.get("zona");if(p.has("tipo"))f.tipo=p.get("tipo");if(p.has("localidad"))f.localidad=p.get("localidad");if(p.has("barrio"))f.barrio=p.get("barrio");if(p.has("conjunto"))f.conjunto=p.get("conjunto");if(p.has("precio")){f.precioTag=p.get("precio");const pr=[["< 200M","0","200000000"],["200-400M","200000000","400000000"],["400-600M","400000000","600000000"],["600M-1B","600000000","1000000000"],["> 1B","1000000000",""]];const m=pr.find(([t])=>t===p.get("precio"));if(m){f.precioMin=m[1];f.precioMax=m[2];}}if(p.has("pmin"))f.precioMin=p.get("pmin");if(p.has("pmax"))f.precioMax=p.get("pmax");if(p.has("hab"))f.habitaciones=p.get("hab");if(p.has("ban"))f["baños"]=p.get("ban");if(p.has("piso_max"))f.pisoMax=p.get("piso_max");if(p.has("garaje"))f.garaje=true;if(p.has("ascensor"))f.ascensor=true;if(p.has("bono"))f.bonoHabi=true;return{filters:f,search:p.get("q")||"",sort:p.get("sort")||"relevancia",simOpen:p.has("sim"),simNid:p.get("sim_nid")||null,filtersOpen:p.has("filtros")};}
function FilterPanel({open,onClose,filters:f,setFilters:sf,onApply,inv=[],shareUrl}){
  const [filtCopied,setFiltCopied]=useState(false);
  if(!open)return null;
  function handleFiltShare(){if(!shareUrl)return;navigator.clipboard.writeText(shareUrl).then(()=>{setFiltCopied(true);setTimeout(()=>setFiltCopied(false),2500);}).catch(()=>{try{const ta=document.createElement("textarea");ta.value=shareUrl;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);setFiltCopied(true);setTimeout(()=>setFiltCopied(false),2500);}catch(e){}});}
  const u=(k,v)=>sf(prev=>({...prev,[k]:v}));
  const zonaLocs=f.zona!=="Todas"?(ZONA_LOCALIDADES[f.zona]||[]):null;
  const localidades=[...new Set(inv.filter(p=>!zonaLocs||zonaLocs.includes(normText(getLocalidad(p)))).map(p=>prettyLocalidad(getLocalidad(p))).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
  const barrios=[...new Set(inv.filter(p=>(f.localidad==="Todas"||normText(prettyLocalidad(getLocalidad(p)))===normText(f.localidad))&&(!zonaLocs||zonaLocs.includes(normText(getLocalidad(p))))).map(p=>cleanText(p.barrio)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
  const conjuntos=[...new Set(inv.filter(p=>(f.localidad==="Todas"||normText(prettyLocalidad(getLocalidad(p)))===normText(f.localidad))&&(!zonaLocs||zonaLocs.includes(normText(getLocalidad(p))))&&(f.barrio==="Todos"||normText(cleanText(p.barrio))===normText(f.barrio))).map(p=>cleanText(p.conjunto)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
  const precios=[["Todos","",""],["< 200M","0","200000000"],["200-400M","200000000","400000000"],["400-600M","400000000","600000000"],["600M-1B","600000000","1000000000"],["> 1B","1000000000",""]];
  const setP=(tag,mn,mx)=>sf(prev=>({...prev,precioTag:tag,precioMin:mn,precioMax:mx}));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",zIndex:1100,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:60,overflowY:"auto",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:20,width:"92%",maxWidth:500,margin:"0 auto 40px",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
        <div style={{padding:"20px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:800,color:"#1B2A4A",margin:0}}><span style={{background:"linear-gradient(135deg,#FF6B35,#F7C948)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Buscar</span> inmueble</h2>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={handleFiltShare} title="Compartir búsqueda" style={{background:filtCopied?"#E8F5E9":"#F0F3F7",border:"none",borderRadius:20,padding:"6px 12px",cursor:"pointer",color:filtCopied?"#2E7D32":"#5D6D7E",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:5,transition:"all .2s",whiteSpace:"nowrap"}}>
              {filtCopied?<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>¡Copiado!</>:<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>Compartir</>}
            </button>
            <button onClick={onClose} style={{background:"#F0F3F7",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:"#5D6D7E"}}>✕</button>
          </div>
        </div>
        <div style={{padding:"16px 20px 24px",display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:8}}>Zona</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["Todas",...ZONA_ORDEN].map(z=><button key={z} onClick={()=>sf(prev=>({...prev,zona:z,localidad:"Todas",barrio:"Todos",conjunto:"Todos"}))} style={{padding:"7px 13px",borderRadius:20,border:"2px solid",borderColor:f.zona===z?"#1B4F72":"#E0E0E0",background:f.zona===z?"#1B4F72":"white",color:f.zona===z?"white":"#5D6D7E",fontWeight:600,fontSize:12,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}}>{z}</button>)}
            </div>
          </div>
          <div><div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:8}}>Tipo</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["Todos","Apartamento","Casa"].map(t=><button key={t} onClick={()=>u("tipo",t)} style={{padding:"9px 18px",borderRadius:20,border:"2px solid",borderColor:f.tipo===t?"#1B4F72":"#E0E0E0",background:f.tipo===t?"#1B4F72":"white",color:f.tipo===t?"white":"#5D6D7E",fontWeight:600,fontSize:13,cursor:"pointer",transition:"all .15s"}}>{t}</button>)}</div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>
              <div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:6}}>Localidad</div>
              <select value={f.localidad} onChange={e=>sf(prev=>({...prev,localidad:e.target.value,barrio:"Todos",conjunto:"Todos"}))} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"2px solid #D5DBDB",fontSize:12,fontWeight:600,background:"white",cursor:"pointer"}}>
                <option value="Todas">Todas</option>
                {localidades.map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:6}}>Barrio</div>
              <select value={f.barrio} onChange={e=>sf(prev=>({...prev,barrio:e.target.value,conjunto:"Todos"}))} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"2px solid #D5DBDB",fontSize:12,fontWeight:600,background:"white",cursor:"pointer"}}>
                <option value="Todos">Todos</option>
                {barrios.map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:6}}>Conjunto</div>
            <select value={f.conjunto} onChange={e=>u("conjunto",e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"2px solid #D5DBDB",fontSize:12,fontWeight:600,background:"white",cursor:"pointer"}}>
              <option value="Todos">Todos</option>
              {conjuntos.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:8}}>Extras</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[["Parqueadero","garaje",false],["Ascensor","ascensor",false],["Bono HABI","bonoHabi",true]].map(([l,k,sp])=><button key={k} onClick={()=>u(k,!f[k])} style={{padding:"9px 16px",borderRadius:20,border:"2px solid",borderColor:f[k]?(sp?"#7B2FF7":"#1B4F72"):"#E0E0E0",background:f[k]?(sp?"#7B2FF7":"#1B4F72"):"white",color:f[k]?"white":"#5D6D7E",fontWeight:700,fontSize:12,cursor:"pointer"}}>{l}</button>)}</div>
          </div>
          <div><div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:8}}>Precio</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{precios.map(([label,mn,mx])=><button key={label} onClick={()=>setP(label,mn,mx)} style={{padding:"8px 14px",borderRadius:18,border:"2px solid",borderColor:f.precioTag===label?"#B7791F":"#F7C948",background:f.precioTag===label?"#F59E0B":"#FFF8E1",color:f.precioTag===label?"white":"#92400E",fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .15s"}}>{label}</button>)}</div></div>
          <div><div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:8}}>Habitaciónes</div><div style={{display:"flex",gap:6}}>{["Todas","1","2","3","4","5+"].map(n=><button key={n} onClick={()=>u("habitaciones",n)} style={{width:40,height:40,borderRadius:"50%",border:"2px solid",borderColor:f.habitaciones===n?"#1B4F72":"#E0E0E0",background:f.habitaciones===n?"#1B4F72":"white",color:f.habitaciones===n?"white":"#5D6D7E",fontWeight:700,fontSize:n==="Todas"?9:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{n}</button>)}</div></div>
          <div><div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:8}}>Baños</div><div style={{display:"flex",gap:6}}>{["Todos","1","2","3","4+"].map(n=><button key={n} onClick={()=>u("baños",n)} style={{width:40,height:40,borderRadius:"50%",border:"2px solid",borderColor:f["baños"]===n?"#1B4F72":"#E0E0E0",background:f["baños"]===n?"#1B4F72":"white",color:f["baños"]===n?"white":"#5D6D7E",fontWeight:700,fontSize:n==="Todos"?9:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{n}</button>)}</div></div>
          <div><div style={{fontWeight:700,fontSize:12,color:"#1B2A4A",marginBottom:8}}>Piso máximo</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["Sin límite",""],["1°","1"],["2°","2"],["3°","3"],["4°","4"],["5°","5"],["6°","6"],["7°","7"],["8°","8"],["10°","10"]].map(([label,val])=><button key={val} onClick={()=>u("pisoMax",val)} style={{padding:"7px 11px",borderRadius:18,border:"2px solid",borderColor:f.pisoMax===val?"#1B4F72":"#E0E0E0",background:f.pisoMax===val?"#1B4F72":"white",color:f.pisoMax===val?"white":"#5D6D7E",fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .15s"}}>{label}</button>)}</div></div>
          <div style={{display:"flex",gap:10}}><button onClick={()=>sf(dflt())} style={{flex:1,padding:12,borderRadius:12,border:"2px solid #D5DBDB",background:"white",fontWeight:700,fontSize:14,cursor:"pointer",color:"#5D6D7E"}}>Limpiar</button><button onClick={onApply} style={{flex:2,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#FF6B35,#E74C3C)",color:"white",fontWeight:800,fontSize:15,cursor:"pointer"}}>Aplicar filtros</button></div>
        </div>
      </div>
    </div>
  );
}

/* ============ CARD with 360 badge ============ */
function hasRealImages(images){
  if(!images||images.length===0)return false;
  return images.some(img=>img&&img.startsWith("http")&&!img.includes("unsplash.com")&&!img.endsWith(".svg"));
}

function Card({p,onClick,featured,onSimCredit}){
  const [ii,setII]=useState(0);const [dir,setDir]=useState(1);const imgs=p.images||[];const d=disc(p);
  const realPhotos=hasRealImages(imgs);
  const noPhotosNo360=!realPhotos&&!p.url_360;
  const goPrev=e=>{e.stopPropagation();setDir(-1);setII(i=>i>0?i-1:imgs.length-1);};
  const goNext=e=>{e.stopPropagation();setDir(1);setII(i=>i<imgs.length-1?i+1:0);};
  const goDot=(e,i)=>{e.stopPropagation();setDir(i>=ii?1:-1);setII(i);};
  return(
    <div className="card-wrap" onClick={()=>onClick(p)} style={{background:"white",borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"transform .2s, box-shadow .2s",boxShadow:"0 2px 12px rgba(27,79,114,0.07)",border:featured?"2px solid #FF6B35":"1px solid rgba(27,79,114,0.06)",minWidth:0}}>
      <div style={{position:"relative",paddingTop:"58%",overflow:"hidden",background:"#E8ECF0"}}>
        {realPhotos?<div key={ii} className={dir>0?"card-img-slide-right":"card-img-slide-left"}><Image src={imgs[ii]||"https://via.placeholder.com/600x400"} alt={p.titulo} fill sizes="(max-width:768px) 100vw, 280px" style={{objectFit:"cover"}} unoptimized /></div>:p.url_360?<iframe src={p.url_360} title="Vista 360" loading="lazy" style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none",pointerEvents:"none"}} />:<div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#1B2A4A,#2C3E50)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>}
        {noPhotosNo360&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) rotate(-35deg)",background:"#E74C3C",color:"white",padding:"8px 40px",fontSize:16,fontWeight:900,letterSpacing:3,textTransform:"uppercase",whiteSpace:"nowrap",zIndex:5,boxShadow:"0 4px 20px rgba(231,76,60,0.5)"}}>VENDIDO</div>}
        {imgs.length>1&&<><button onClick={goPrev} style={{position:"absolute",left:5,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.35)",border:"none",borderRadius:"50%",width:26,height:26,color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,zIndex:2}}>‹</button><button onClick={goNext} style={{position:"absolute",right:5,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.35)",border:"none",borderRadius:"50%",width:26,height:26,color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,zIndex:2}}>›</button></>}
        {imgs.length>1&&<div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",display:"flex",gap:3,zIndex:2}}>{imgs.map((_,i)=><button key={i} onClick={e=>goDot(e,i)} style={{width:6,height:6,borderRadius:"50%",border:"1.5px solid white",cursor:"pointer",background:i===ii?"white":"rgba(255,255,255,0.3)",padding:0}} />)}</div>}
        {p.tipo&&<div style={{position:"absolute",top:8,left:8,background:"#1B4F72",color:"white",padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:600}}>{tipoLabel(p.tipo)}</div>}
          {d>0&&<div style={{position:"absolute",top:8,right:8,background:"#E74C3C",color:"white",padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:800}}>{d}% OFF</div>}
          {num(p.bonoHabi)>0&&<div style={{position:"absolute",bottom:22,left:8,background:"linear-gradient(135deg,#7B2FF7,#5B1FA6)",color:"white",padding:"2px 8px",borderRadius:12,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",gap:3}}><Image src={LOGO_HABI_W} alt="" width={24} height={9} style={{objectFit:"contain"}} />Bono {fmtM(p.bonoHabi)}</div>}
        {p.url_360&&<div style={{position:"absolute",top:8,left:p.tipo?(p.tipo.length*6.5+24):8,background:"rgba(0,0,0,0.6)",color:"white",padding:"2px 7px",borderRadius:12,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",gap:2}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><ellipse cx="12" cy="12" rx="4" ry="10"/></svg>360°
        </div>}
      </div>
      <div style={{padding:"10px 12px"}}>
        <h3 style={{margin:0,fontSize:"clamp(11px,2.8vw,13px)",fontWeight:700,color:"#1B2A4A",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titulo}</h3>
        <p style={{margin:"2px 0 0",fontSize:"clamp(10px,2.4vw,11px)",color:"#5D6D7E",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[cleanText(p.barrio),prettyLocalidad(getLocalidad(p))].filter(Boolean).join(" · ")}</p>
        {p.direccion&&<p style={{margin:"2px 0 0",fontSize:"clamp(9px,2.2vw,10px)",color:"#7F8C8D",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(()=>{const url=getGoogleMapsUrl(p);return url?<a href={url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#1B4F72",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:2}}><svg width="9" height="9" viewBox="0 0 24 24" fill="#1B4F72"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>{cleanText(p.direccion)}</a>:cleanText(p.direccion);})()}</p>}
        <div style={{display:"flex",gap:6,marginTop:5,fontSize:"clamp(9px,2.2vw,10px)",color:"#7F8C8D",flexWrap:"wrap"}}>{p.area&&<span>{p.area}m²</span>}{p.habitaciones&&p.habitaciones!=="0"&&<span>{p.habitaciones} hab</span>}{(p["baños"]??p.banos)&&(p["baños"]??p.banos)!=="0"&&<span>{p["baños"]??p.banos} bañ</span>}{p.garaje&&p.garaje!=="0"&&<span>{p.garaje} parq</span>}</div>
        <div style={{marginTop:7,paddingTop:7,borderTop:"1px solid #EBF0F5",display:"flex",justifyContent:"space-between",alignItems:"center",gap:4}}>
          <div style={{minWidth:0,overflow:"hidden"}}>{d>0&&<span style={{fontSize:10,color:"#AEB6BF",textDecoration:"line-through",marginRight:3}}>{fmtM(p.precio_original)}</span>}<span style={{fontSize:"clamp(12px,3vw,15px)",fontWeight:800,color:"#E74C3C"}}>{fmt(p.precio_venta)}</span></div>
          <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>{onSimCredit&&<button onClick={e=>{e.stopPropagation();onSimCredit(p);}} style={{background:"linear-gradient(135deg,#7B2FF7,#5B1FA6)",color:"white",padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:600,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>💜 Simular</button>}<span style={{background:"#1B4F72",color:"white",padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:600}}>Ver</span></div>
        </div>
      </div>
    </div>
  );
}

/* ============ MODAL with 360 + Carousel tabs ============ */
function Modal({p,onClose,onSimCredit}){
  const [ii,setII]=useState(0);
  const [tab,setTab]=useState("fotos");
  const [valid360,setValid360]=useState(false);
  const [checking360,setChecking360]=useState(false);
  const imgs=p?.images||[];const d=p?disc(p):0;
  const realPhotos=hasRealImages(imgs);
  const noPhotosNo360=!realPhotos&&!valid360&&!checking360;
  const [emblaRef,emblaApi]=useEmblaCarousel({
    loop:imgs.length>1,
    align:"start",
    dragFree:false,
    containScroll:"trimSnaps"
  });
  const prev=useCallback(()=>emblaApi&&emblaApi.scrollPrev(),[emblaApi]);
  const next=useCallback(()=>emblaApi&&emblaApi.scrollNext(),[emblaApi]);
  const goTo=useCallback(i=>emblaApi&&emblaApi.scrollTo(i),[emblaApi]);

  useEffect(()=>{
    if(!emblaApi)return;
    const onSelect=()=>setII(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select",onSelect);
    emblaApi.on("reInit",onSelect);
    return()=>{
      emblaApi.off("select",onSelect);
      emblaApi.off("reInit",onSelect);
    };
  },[emblaApi]);

  useEffect(()=>{
    if(emblaApi)emblaApi.scrollTo(0,true);
  },[p,emblaApi]);

  useEffect(()=>{
    setValid360(false);
    if(!p?.url_360){
      setChecking360(false);
      setTab("fotos");
      return;
    }
    setChecking360(true);
    let cancelled=false;
    fetch('/api/check-360?url='+encodeURIComponent(p.url_360))
      .then(r=>r.json())
      .then(d=>{if(!cancelled){
        setChecking360(false);
        if(d.valid){
          setValid360(true);
          if(!hasRealImages(p?.images))setTab("360");
        }else{
          setTab(t=>t==='360'?'fotos':t);
        }
      }})
      .catch(()=>{if(!cancelled)setChecking360(false);});
    return()=>{cancelled=true;};
  },[p?.url_360]);

  if(!p)return null;

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:10,animation:"fadeIn .25s",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:20,maxWidth:750,width:"100%",maxHeight:"95vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.3)",margin:"auto"}}>
        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"2px solid #EBF0F5",position:"sticky",top:0,background:"white",zIndex:2,borderRadius:"20px 20px 0 0"}}>
          {realPhotos&&<button onClick={()=>setTab("fotos")} style={{flex:1,padding:"14px",border:"none",background:tab==="fotos"?"white":"#F8F9FA",cursor:"pointer",fontWeight:800,fontSize:14,color:tab==="fotos"?"#1B4F72":"#999",borderBottom:tab==="fotos"?"3px solid #1B4F72":"3px solid transparent",borderRadius:tab==="fotos"?"20px 0 0 0":"0",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Fotos ({imgs.length})
          </button>}
          {valid360&&<button onClick={()=>setTab("360")} style={{flex:1,padding:"14px",border:"none",background:tab==="360"?"white":"#F8F9FA",cursor:"pointer",fontWeight:800,fontSize:14,color:tab==="360"?"#7B2FF7":"#999",borderBottom:tab==="360"?"3px solid #7B2FF7":"3px solid transparent",borderRadius:!realPhotos?"20px 20px 0 0":tab==="360"?"0 20px 0 0":"0",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><ellipse cx="12" cy="12" rx="4" ry="10"/></svg>
            Vista 360°
          </button>}
          <button onClick={onClose} style={{padding:"14px 18px",border:"none",background:"#F8F9FA",cursor:"pointer",fontSize:18,color:"#999",borderRadius:"0 20px 0 0",flexShrink:0}}>✕</button>
        </div>

        {/* VENDIDO banner when no photos and no 360 */}
        {noPhotosNo360&&<div style={{position:"relative",height:"clamp(200px,40vw,320px)",background:"linear-gradient(135deg,#1B2A4A,#2C3E50)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </div>
          <div style={{background:"#E74C3C",color:"white",padding:"16px 60px",fontSize:"clamp(22px,5vw,36px)",fontWeight:900,letterSpacing:6,textTransform:"uppercase",transform:"rotate(-15deg)",boxShadow:"0 6px 30px rgba(231,76,60,0.5)",textAlign:"center",zIndex:1}}>VENDIDO</div>
        </div>}

        {/* Photo carousel tab */}
        {tab==="fotos"&&realPhotos&&<div style={{position:"relative",height:"clamp(200px,40vw,320px)",background:"#111",overflow:"hidden"}}>
          <div className="embla-modal" ref={emblaRef}>
            <div className="embla-modal__container">
              {imgs.map((img,i)=><div className="embla-modal__slide" key={img+"-"+i} style={{position:"relative"}}><Image src={img} alt="" fill sizes="100vw" style={{objectFit:"cover"}} unoptimized /></div>)}
            </div>
          </div>
          {imgs.length>1&&<><button onClick={prev} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button><button onClick={next} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button></>}
          <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6}}>{imgs.map((_,i)=><button key={i} onClick={()=>goTo(i)} style={{width:10,height:10,borderRadius:"50%",border:"2px solid white",cursor:"pointer",background:i===ii?"white":"transparent",padding:0}} />)}</div>
          {/* Thumbnails strip */}
          {imgs.length>1&&<div className="modal-thumbs" style={{position:"absolute",bottom:30,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4}}>{imgs.map((img,i)=><Image key={i} src={img} alt="" width={44} height={30} onClick={()=>goTo(i)} style={{objectFit:"cover",borderRadius:4,border:i===ii?"2px solid white":"2px solid transparent",cursor:"pointer",opacity:i===ii?1:0.6}} unoptimized />)}</div>}
          {d>0&&<div style={{position:"absolute",top:12,left:12,background:"#E74C3C",color:"white",padding:"6px 14px",borderRadius:20,fontSize:13,fontWeight:800}}>{d}% DESC.</div>}
          {num(p.bonoHabi)>0&&<div style={{position:"absolute",top:d>0?54:12,left:12,background:"linear-gradient(135deg,#7B2FF7,#5B1FA6)",color:"white",padding:"6px 14px",borderRadius:20,fontSize:13,fontWeight:800,display:"flex",alignItems:"center",gap:6}}><Image src={LOGO_HABI_W} alt="" width={32} height={12} style={{objectFit:"contain"}} />Bono: {fmt(p.bonoHabi)}</div>}
          <div style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.6)",color:"white",padding:"4px 10px",borderRadius:14,fontSize:12,fontWeight:600}}>{ii+1}/{imgs.length}</div>
        </div>}

        {/* 360 view tab */}
        {tab==="360"&&<div style={{position:"relative",height:"clamp(280px,50vw,450px)",background:"#111"}}>
          <iframe src={p.url_360} title="Vista 360" loading="lazy" style={{width:"100%",height:"100%",border:"none"}} allowFullScreen allow="xr-spatial-tracking" />
          <div style={{position:"absolute",top:10,left:10,background:"linear-gradient(135deg,#7B2FF7,#5B1FA6)",color:"white",padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:800,display:"flex",alignItems:"center",gap:5}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><ellipse cx="12" cy="12" rx="4" ry="10"/></svg>
            Recorrido Virtual Matterport
          </div>
        </div>}

        {/* Property details */}
        <div style={{padding:"clamp(14px,3vw,20px) clamp(14px,3vw,22px)"}}>
          <div className="modal-detail-row" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <h2 style={{margin:0,fontSize:"clamp(15px,3.5vw,22px)",color:"#1B2A4A",fontFamily:"'Playfair Display',serif",lineHeight:1.2,wordWrap:"break-word"}}>{p.titulo}</h2>
              <p style={{margin:"4px 0",color:"#5D6D7E",fontSize:"clamp(11px,2.5vw,13px)",wordWrap:"break-word"}}>{[cleanText(p.barrio),prettyLocalidad(getLocalidad(p)),cleanText(p.ciudad)].filter(Boolean).join(", ")}{p.conjunto?" · "+cleanText(p.conjunto):""}</p>
              {p.direccion&&(()=>{const url=getGoogleMapsUrl(p);return <div style={{marginTop:5}}><a href={url||"#"} target={url?"_blank":undefined} rel={url?"noopener noreferrer":undefined} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,color:"#1B4F72",textDecoration:"none",background:"#EAF2FB",padding:"3px 8px",borderRadius:20,fontWeight:600,letterSpacing:0.3}}><svg width="10" height="10" viewBox="0 0 24 24" fill="#1B4F72"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>{cleanText(p.direccion)}</a></div>;})()}
              {p.nid&&<div style={{marginTop:4}}>{p.url_habi?<a href={p.url_habi} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,color:"#9B59B6",textDecoration:"none",background:"#F5EEF8",padding:"3px 8px",borderRadius:20,fontWeight:600,letterSpacing:0.3}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>NID HABI: {p.nid}</a>:<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,color:"#9B59B6",background:"#F5EEF8",padding:"3px 8px",borderRadius:20,fontWeight:600,letterSpacing:0.3}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>NID HABI: {p.nid}</span>}</div>}
            </div>
            <div className="modal-price-col" style={{textAlign:"right",flexShrink:0}}>{d>0&&<div style={{fontSize:12,color:"#AEB6BF",textDecoration:"line-through"}}>{fmtM(p.precio_original)}</div>}<div style={{fontSize:"clamp(17px,4vw,24px)",fontWeight:800,color:"#E74C3C"}}>{fmt(p.precio_venta)}</div>{num(p.admin)>0&&<div style={{fontSize:10,color:"#7F8C8D"}}>Admin: {fmt(p.admin)}/mes</div>}</div>
          </div>
          <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}>{[{l:"Área",v:p.area?p.area+"m²":""},{l:"Hab",v:p.habitaciones},{l:"Baños",v:p["baños"]??p.banos},{l:"Parq",v:p.garaje},{l:"Estrato",v:p.estrato},{l:"Piso",v:p.piso},{l:"Ascensor",v:p.ascensor?"Sí":"No"}].filter(x=>x.v&&x.v!=="0"&&x.v!=="undefined"&&x.v!=="undefinedm²").map(({l,v})=><div key={l} style={{background:"#F0F4F8",padding:"5px 10px",borderRadius:8,textAlign:"center",minWidth:48}}><div style={{fontSize:9,color:"#7F8C8D"}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:"#1B2A4A"}}>{v}</div></div>)}</div>
          {p.descripcion&&<p style={{marginTop:12,fontSize:"clamp(11px,2.5vw,13px)",color:"#34495E",lineHeight:1.5,wordWrap:"break-word",overflowWrap:"break-word"}}>{p.descripcion}</p>}
          <div className="modal-actions" style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
            <button onClick={()=>handleScheduleClick(p)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"linear-gradient(135deg,#1B4F72,#1B2A4A)",color:"white",borderRadius:12,padding:"14px 16px",fontSize:"clamp(13px,3vw,15px)",fontWeight:700,border:"none",cursor:"pointer",width:"100%",boxShadow:"0 4px 14px rgba(27,79,114,0.35)"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.592-.768-6.39-2.07l-.446-.334-2.633.882.882-2.633-.334-.446A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Agendar Visita
            </button>
            <button onClick={()=>handleWhatsAppClick(p)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"white",color:"#1B4F72",borderRadius:12,padding:"11px 10px",fontSize:"clamp(11px,2.5vw,13px)",fontWeight:700,border:"2px solid #1B4F72",cursor:"pointer",width:"100%"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1B4F72"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.592-.768-6.39-2.07l-.446-.334-2.633.882.882-2.633-.334-.446A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Solicitar más información
            </button>
            {onSimCredit&&<button onClick={()=>onSimCredit(p)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"linear-gradient(135deg,#7B2FF7,#5B1FA6)",color:"white",borderRadius:12,padding:"13px 10px",fontSize:"clamp(12px,2.5vw,14px)",fontWeight:700,border:"none",cursor:"pointer",width:"100%"}}>
              <Image src={LOGO_HABI_W} alt="" width={32} height={12} style={{objectFit:"contain"}} />
              Simular Crédito HabiCredit
            </button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ MAIN APP ============ */
export default function App(){
  const [inv,setInv]=useState(INV);
  const [search,setSearch]=useState("");
  const [page,setPage]=useState("inicio");
  const [sel,setSel]=useState(null);
  useEffect(()=>{
    if(sel){window.history.pushState(null,'','/'+sel.nid);}
    else{const p=window.location.pathname;if(p&&p!=='/')window.history.replaceState(null,'',catalogURL.current);}
  },[sel]);
  useEffect(()=>{
    const nid=window.location.pathname.replace('/','');
    if(nid){const p=INV.find(x=>x.nid===nid);if(p)setSel(p);}
    const parsed=parseURLFilters();
    if(parsed){setFilters(parsed.filters);setApplied(parsed.filters);setSearch(parsed.search);setSort(parsed.sort);setPage("catalogo");let c=0;const na=parsed.filters;if(na.tipo!=="Todos")c++;if(na.localidad!=="Todas")c++;if(na.barrio!=="Todos")c++;if(na.conjunto!=="Todos")c++;if(na.precioTag&&na.precioTag!=="Todos")c++;if(na.habitaciones!=="Todas")c++;if(na["baños"]!=="Todos")c++;if(na.pisoMax)c++;if(na.garaje)c++;if(na.ascensor)c++;if(na.bonoHabi)c++;setFCount(c);if(parsed.simOpen){setCOpen(true);if(parsed.simNid){const sp=INV.find(x=>x.nid===parsed.simNid);if(sp)setSimProperty(sp);}}if(parsed.filtersOpen){setFOpen(true);}}
  },[]);
  const [reviewRef,reviewApi]=useEmblaCarousel({
    loop:false,
    align:"start",
    containScroll:"trimSnaps",
    slidesToScroll:2,
    breakpoints:{"(max-width: 768px)":{slidesToScroll:1}}
  });
  const [mobMenu,setMobMenu]=useState(false);
  const [fOpen,setFOpen]=useState(false);
  const [cOpen,setCOpen]=useState(false);
  const [simProperty,setSimProperty]=useState(null);
  const [filters,setFilters]=useState(dflt);
  const [applied,setApplied]=useState(dflt);
  const [fCount,setFCount]=useState(0);
  const [sort,setSort]=useState("relevancia");
  const catalogURL=useRef("/");
  const reviewPrev=useCallback(()=>reviewApi&&reviewApi.scrollPrev(),[reviewApi]);
  const reviewNext=useCallback(()=>reviewApi&&reviewApi.scrollNext(),[reviewApi]);

  useEffect(()=>{fetch("/data/inventory.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(d&&d.length)setInv(d.map(p=>({...p,tipo:p.tipo||p.tipo_de_propiedad||"",precio_original:p.precio_original||p.precio_anterior||"0",habitaciones:p.habitaciones||p.num_habitaciones||"",baños:p["baños"]||p.banos||"",garaje:p.garaje||p.garajes||"",piso:p.piso||p.num_piso||"",admin:p.admin||p.costo_administracion||0,bonoHabi:p.bonoHabi||p.bonus_value||0,ascensor:p.ascensor!=null?p.ascensor:p.tiene_ascensor==="1",url_habi:p.url_habi||p.url||""})))}).catch(()=>{});},[]);
  useEffect(()=>{
    if(!reviewApi)return;
    const t=setInterval(()=>reviewApi.scrollNext(),5000);
    return()=>clearInterval(t);
  },[reviewApi]);

  // Sync URL params whenever catalog state changes (not while a property is open)
  useEffect(()=>{
    if(sel)return; // sel effect manages URL while property is open
    if(page==="catalogo"){const u=buildCatalogURL(applied,search,sort,cOpen,cOpen&&simProperty?.nid||null,fOpen);catalogURL.current=u;window.history.replaceState(null,'',u);}
    else{catalogURL.current="/";window.history.replaceState(null,'','/');}
  },[applied,search,sort,page,cOpen,fOpen,simProperty]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyF=()=>{
    const na={...filters};setApplied(na);
    let c=0;if(na.zona&&na.zona!=="Todas")c++;if(na.tipo!=="Todos")c++;if(na.localidad!=="Todas")c++;if(na.barrio!=="Todos")c++;if(na.conjunto!=="Todos")c++;if(na.precioTag&&na.precioTag!=="Todos")c++;if(na.habitaciones!=="Todas")c++;if(na["baños"]!=="Todos")c++;if(na.pisoMax)c++;if(na.garaje)c++;if(na.ascensor)c++;if(na.bonoHabi)c++;
    setFCount(c);setFOpen(false);setPage("catalogo");
  };

  const filterFn=p=>{
    const q=search.toLowerCase();
    if(q&&![p.titulo,p.barrio,p.conjunto,p.nid,p.ciudad,p.tipo,getLocalidad(p),p.zona_mediana].some(f=>(f||"").toString().toLowerCase().includes(q)))return false;
    const af=applied;
    if(af.zona&&af.zona!=="Todas"){const zLocs=ZONA_LOCALIDADES[af.zona]||[];if(!zLocs.includes(normText(getLocalidad(p))))return false;}
    if(af.tipo!=="Todos"&&normText(p.tipo||"")!==normText(af.tipo)&&!(af.tipo==="Casa"&&normText(p.tipo||"").startsWith("casa")))return false;
    if(af.localidad!=="Todas"&&normText(prettyLocalidad(getLocalidad(p)))!==normText(af.localidad))return false;
    if(af.barrio!=="Todos"&&normText(cleanText(p.barrio))!==normText(af.barrio))return false;
    if(af.conjunto!=="Todos"&&normText(cleanText(p.conjunto))!==normText(af.conjunto))return false;
    if(af.precioMin&&parseInt(p.precio_venta||0)<parseInt(af.precioMin))return false;
    if(af.precioMax&&parseInt(p.precio_venta||0)>parseInt(af.precioMax))return false;
    if(af.habitaciones!=="Todas"){const h=parseInt(p.habitaciones||0);if(af.habitaciones==="5+"?h<5:h!==parseInt(af.habitaciones))return false}
    if(af["baños"]!=="Todos"){const b=parseInt((p["baños"]??p.banos)||0);if(af["baños"]==="4+"?b<4:b!==parseInt(af["baños"]))return false}
    if(af.pisoMax&&parseInt(p.piso||0)>parseInt(af.pisoMax))return false;
    if(af.garaje&&(!p.garaje||p.garaje==="0"))return false;
    if(af.ascensor&&!p.ascensor)return false;
    if(af.bonoHabi&&(!p.bonoHabi||p.bonoHabi<=0))return false;
    return true;
  };

  const filtered=[...inv.filter(filterFn)].sort((a,b)=>{
    if(sort==="precio_asc")return parseInt(a.precio_venta||0)-parseInt(b.precio_venta||0);
    if(sort==="precio_desc")return parseInt(b.precio_venta||0)-parseInt(a.precio_venta||0);
    if(sort==="descuento")return disc(b)-disc(a);
    if(sort==="bono")return(b.bonoHabi||0)-(a.bonoHabi||0);
    if(sort==="area")return parseInt(b.area||0)-parseInt(a.area||0);
    return 0;
  });

  const featured=(()=>{
    const ordered=[...inv].sort((a,b)=>featScore(b)-featScore(a));
    const primary=ordered.filter(isFeat);
    const backup=ordered.filter(p=>!isFeat(p));
    const merged=[...primary,...backup];
    const seen=new Set();
    return merged.filter(p=>{const k=featKey(p);if(seen.has(k))return false;seen.add(k);return true}).slice(0,6);
  })();
  const clearAll=()=>{setApplied(dflt());setFilters(dflt());setFCount(0);setSearch("")};

  return(
    <div style={{maxWidth:"100vw",overflowX:"hidden",background:"#F0F3F7",color:"#1B2A4A",colorScheme:"light"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        :root{color-scheme:light only!important}
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-text-size-adjust:100%}
        html,body{
          background:#F0F3F7!important;color:#1B2A4A!important;
          font-family:'Outfit',sans-serif;overflow-x:hidden!important;
          -webkit-font-smoothing:antialiased;color-scheme:light!important;
        }
        img{max-width:100%;display:block}
        input,button,select,textarea{font-family:inherit;background-color:white}
        button{background:none;border:none;cursor:pointer}
        a{color:inherit;text-decoration:none}
        /* Force light mode on ALL elements */
        @media(prefers-color-scheme:dark){
          :root{color-scheme:light only!important}
          *{color-scheme:light!important}
          html,body,div,section,header,footer,nav,main,article,aside,
          input,select,textarea,button,a,p,h1,h2,h3,h4,h5,h6,span,
          img,svg,iframe,table,tr,td,th{
            color-scheme:light!important;
          }
          html,body{background:#F0F3F7!important;color:#1B2A4A!important}
          input,select,textarea{background-color:white!important;color:#1B2A4A!important;border-color:#D5DBDB!important}
        }
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes pulse{0%,100%{box-shadow:0 3px 12px rgba(255,107,53,0.2)}70%{box-shadow:0 3px 12px rgba(255,107,53,0.2),0 0 0 7px rgba(255,107,53,0)}}
        .wf{position:fixed;bottom:18px;left:18px;width:52px;height:52px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(37,211,102,0.4);z-index:999;cursor:pointer;animation:float 3s ease-in-out infinite;text-decoration:none}
        .so{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform .3s;cursor:pointer;text-decoration:none}.so:hover{transform:translateY(-2px)}
        .card-wrap{width:100%;min-width:0;overflow:hidden}
        .reviews-embla{width:100%;max-width:100%;overflow:hidden;touch-action:pan-y pinch-zoom;cursor:grab}
        .reviews-embla:active{cursor:grabbing}
        .reviews-embla__container{display:flex;margin-left:-8px}
        .reviews-embla__slide{flex:0 0 50%;min-width:0;padding-left:8px;transition:transform .35s ease,opacity .35s ease}
        .embla-modal{height:100%;overflow:hidden;touch-action:pan-y pinch-zoom;cursor:grab}
        .embla-modal:active{cursor:grabbing}
        .embla-modal__container{display:flex;height:100%}
        .embla-modal__slide{flex:0 0 100%;min-width:0;position:relative;background:#111}
        .embla-modal__slide img{width:100%;height:100%;object-fit:cover;transform:scale(1.01);transition:transform .35s ease}
        /* ---- MOBILE 768 ---- */
        @media(max-width:768px){
          .hero-grid{flex-direction:column!important;gap:14px!important}
          .hero-imgs{flex:none!important;width:100%!important;flex-direction:row!important;gap:6px!important}
          .hero-imgs img{height:110px!important;flex:1!important;min-width:0!important;object-fit:cover!important;border-radius:10px!important}
          .hero-copy{width:100%!important;min-width:0!important}
          .cat-grid{grid-template-columns:1fr!important;gap:10px!important}
          .nav-desk{display:none!important}
          .mob-btn{display:flex!important}
          .footer-g{flex-direction:column!important;align-items:center!important;text-align:center!important}
          .search-wrap{display:none!important}
          .search-wrap-mob{display:block!important}
          .reviews-embla__slide{flex-basis:100%!important}
          .sort-bar{flex-direction:column!important;align-items:stretch!important;gap:8px!important}
          .modal-detail-row{flex-direction:column!important;gap:4px!important}
          .modal-price-col{text-align:left!important}
          .modal-actions{flex-direction:column!important}
          .modal-thumbs{display:none!important}
          .house-deco{width:28%!important;opacity:0.04!important}
        }
        /* ---- MOBILE 420 ---- */
        @media(max-width:420px){
          .cat-grid{grid-template-columns:1fr!important;gap:10px!important;max-width:100%!important}
          .hero-imgs{flex-direction:column!important}
          .hero-imgs img{height:90px!important;border-radius:8px!important}
          .house-deco{display:none!important}
        }
        @media(min-width:769px){.mob-btn{display:none!important}.mob-menu{display:none!important}.search-wrap-mob{display:none!important}}
      `}</style>

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(240,243,247,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(27,79,114,0.08)",overflow:"hidden"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"6px clamp(10px,3vw,16px)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
          <Image src={LOGO_BF} alt="BF" width={107} height={40} onClick={()=>setPage("inicio")} style={{height:"clamp(32px,8vw,40px)",width:"auto",objectFit:"contain",cursor:"pointer",flexShrink:0}} />
          <nav className="nav-desk" style={{display:"flex",gap:2,alignItems:"center"}}>
            {[["Inicio","inicio"],["Catálogo","catalogo"]].map(([l,id])=><button key={id} onClick={()=>setPage(id)} style={{fontWeight:600,fontSize:14,color:page===id?"white":"#1B2A4A",padding:"7px 14px",borderRadius:8,border:"none",background:page===id?"#1B4F72":"transparent",cursor:"pointer"}}>{l}</button>)}
            <button onClick={()=>{setCOpen(true);setSimProperty(null);}} style={{fontWeight:700,fontSize:14,color:"#7B2FF7",padding:"7px 14px",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><Image src={LOGO_HABI} alt="" width={32} height={12} style={{objectFit:"contain"}} />Crédito</button>
          </nav>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>{setFilters({...applied});setFOpen(true)}} style={{display:"flex",alignItems:"center",gap:4,padding:"7px clamp(10px,3vw,16px)",borderRadius:20,border:"none",cursor:"pointer",fontWeight:800,fontSize:"clamp(11px,2.8vw,13px)",background:"linear-gradient(135deg,#FF6B35,#E74C3C)",color:"white",animation:"pulse 2s infinite",position:"relative",flexShrink:0}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>Buscar
              {fCount>0&&<span style={{position:"absolute",top:-5,right:-5,background:"#F7C948",color:"#1B2A4A",width:18,height:18,borderRadius:"50%",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{fCount}</span>}
            </button>
            <div className="search-wrap" style={{position:"relative"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="NID, Barrio, Zona..." value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value)setPage("catalogo")}} style={{fontSize:13,padding:"8px 14px 8px 32px",border:"2px solid #D5DBDB",borderRadius:20,outline:"none",width:180,background:"white"}} /></div>
            <div className="search-wrap-mob" style={{position:"relative",minWidth:0,width:130}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)"}}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Barrio, zona..." value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value)setPage("catalogo")}} style={{fontSize:12,padding:"7px 10px 7px 27px",border:"2px solid #D5DBDB",borderRadius:20,outline:"none",width:"100%",background:"white",boxSizing:"border-box"}} /></div>
          </div>
          <button className="mob-btn" onClick={()=>setMobMenu(!mobMenu)} style={{background:"none",border:"none",cursor:"pointer",padding:6}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2">{mobMenu?<path d="M18 6L6 18M6 6l12 12"/>:<path d="M3 12h18M3 6h18M3 18h18"/>}</svg></button>
        </div>
        {mobMenu&&<div className="mob-menu" style={{padding:"8px 16px 16px",display:"flex",flexDirection:"column",gap:4}}>
          {[["Inicio","inicio"],["Catálogo","catalogo"]].map(([l,id])=><button key={id} onClick={()=>{setPage(id);setMobMenu(false)}} style={{fontWeight:600,fontSize:14,color:"#1B2A4A",padding:"10px 14px",borderRadius:8,border:"none",background:page===id?"#EBF0F5":"transparent",cursor:"pointer",textAlign:"left"}}>{l}</button>)}
          <button onClick={()=>{setCOpen(true);setSimProperty(null);setMobMenu(false);}} style={{fontWeight:700,fontSize:14,color:"#7B2FF7",padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:6}}><Image src={LOGO_HABI} alt="" width={32} height={12} style={{objectFit:"contain"}} />Crédito HABI</button>
        </div>}
    
      </header>

      {/* ===== INICIO ===== */}
      {page==="inicio"&&<>
        <section style={{position:"relative",overflow:"hidden",padding:"clamp(20px,4vw,50px) clamp(10px,3vw,16px) clamp(16px,3vw,30px)"}}>
          <HouseDeco />
          <div className="hero-grid" style={{maxWidth:1100,margin:"0 auto",display:"flex",gap:"clamp(16px,3vw,36px)",alignItems:"center"}}>
            <div className="hero-imgs" style={{flex:"0 0 40%",display:"flex",flexDirection:"column",gap:10}}>
              <Image src={HERO_TOP} alt="Interior" width={500} height={195} priority style={{width:"100%",height:195,borderRadius:14,objectFit:"cover",boxShadow:"0 6px 24px rgba(27,79,114,0.1)"}} />
              <Image src={HERO_BOT} alt="Sala" width={500} height={195} priority style={{width:"100%",height:195,borderRadius:14,objectFit:"cover",boxShadow:"0 6px 24px rgba(27,79,114,0.1)"}} />
            </div>
            <div className="hero-copy" style={{flex:1,minWidth:0,animation:"slideUp .7s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                <Image src={LOGO_HABI} alt="HABI" width={48} height={18} style={{objectFit:"contain"}} />
                <span style={{background:"linear-gradient(135deg,#7B2FF7,#5B1FA6)",color:"white",padding:"3px 11px",borderRadius:14,fontSize:10,fontWeight:800}}>Aliados Oficiales HABI</span>
              </div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,5vw,46px)",fontWeight:900,color:"#1B2A4A",lineHeight:1.1,marginBottom:10}}>Tu Buen Futuro<br/>inicia hoy</h1>
                <p style={{fontSize:"clamp(12px,2vw,15px)",color:"#2471A3",lineHeight:1.5,marginBottom:16}}>Amplio catálogo de apartamentos y casas en Bogotá<br/>con recorridos virtuales 360° - Aliados HABI</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                <button onClick={()=>{setPage("catalogo");setSort("bono");}} style={{padding:"10px 18px",borderRadius:10,border:"none",background:"#E74C3C",color:"white",fontWeight:700,fontSize:13,cursor:"pointer"}}>Ofertas</button>
                <button onClick={()=>{setCOpen(true);setSimProperty(null);}} style={{padding:"10px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7B2FF7,#5B1FA6)",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Image src={LOGO_HABI_W} alt="" width={30} height={11} style={{objectFit:"contain"}} />Crédito</button>
                <button onClick={()=>setPage("catalogo")} style={{padding:"10px 18px",borderRadius:10,border:"none",background:"#1B4F72",color:"white",fontWeight:700,fontSize:13,cursor:"pointer"}}>Catálogo ({inv.length})</button>
              </div>
              <div style={{marginTop:20}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#1B2A4A"}}>Clientes Buen Futuro</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span style={{background:"#E8F5E9",color:"#2E7D32",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:10}}>{REVIEWS.length}+ reseñas</span>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
                    <button onClick={reviewPrev} style={{width:24,height:24,borderRadius:"50%",background:"#EBF0F5",color:"#1B2A4A",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
                    <button onClick={reviewNext} style={{width:24,height:24,borderRadius:"50%",background:"#EBF0F5",color:"#1B2A4A",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
                  </div>
                </div>
                <div className="reviews-embla" ref={reviewRef}>
                  <div className="reviews-embla__container">
                    {REVIEWS.map((r,idx)=><div className="reviews-embla__slide" key={r.name+idx}><div style={{background:"white",borderRadius:10,padding:"10px 12px",height:"100%",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",border:"1px solid #EEE"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:26,height:26,borderRadius:"50%",background:r.c,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:11,flexShrink:0}}>{r.i}</div><div style={{minWidth:0}}><div style={{fontWeight:700,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div><div style={{fontSize:9,color:"#999"}}>{r.time}</div></div></div><Stars r={r.rating}/><p style={{marginTop:3,fontSize:11,color:"#555",lineHeight:1.3}}>{r.text}</p></div></div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED */}
        {featured.length>0&&<section style={{padding:"clamp(16px,3vw,24px) clamp(10px,3vw,16px)",maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(20px,4vw,26px)",fontWeight:800,color:"#1B2A4A"}}>Propiedades Destacadas</h2><p style={{color:"#5D6D7E",fontSize:12}}>Descuentos, bonos y mejor valor comercial</p></div>
            <button onClick={()=>setPage("catalogo")} style={{padding:"8px 16px",borderRadius:10,border:"2px solid #1B4F72",background:"transparent",color:"#1B4F72",fontWeight:700,fontSize:12,cursor:"pointer"}}>Ver todo ({inv.length})</button>
          </div>
          <div className="cat-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:14}}>
            {featured.map((p,i)=><div key={p.nid} style={{animation:"slideUp .5s ease "+(i*.07)+"s both"}}><Card p={p} onClick={setSel} featured onSimCredit={prop=>{setSimProperty(prop);setCOpen(true);}} /></div>)}
          </div>
        </section>}

        {/* FOOTER */}
        <section style={{padding:"clamp(24px,4vw,36px) clamp(10px,3vw,16px)",background:"#1B2A4A",borderTop:"4px solid #F4D03F"}}>
          <div className="footer-g" style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:28}}>
            <div><Image src={LOGO_BF} alt="BF" width={112} height={42} style={{marginBottom:8}} /><p style={{color:"#AEB6BF",fontSize:11,maxWidth:230,lineHeight:1.5}}>Tu aliado de confianza en bienes raíces. Aliados oficiales HABI.</p><div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}><Image src={LOGO_HABI} alt="" width={40} height={15} style={{objectFit:"contain"}} /><span style={{color:"#B39DDB",fontSize:10,fontWeight:600}}>Aliados Oficiales</span></div></div>
            <div><h4 style={{color:"#F4D03F",fontWeight:700,fontSize:11,marginBottom:8,letterSpacing:1}}>CONTÁCTANOS</h4><a href={"https://wa.me/"+WA} target="_blank" rel="noopener noreferrer" style={{color:"#25D366",fontSize:12,textDecoration:"none",display:"block",marginBottom:4}}>+57 310 807 4915</a><a href="mailto:Inmobiliariabuenfuturo1@gmail.com" style={{color:"#D5DBDB",fontSize:11,textDecoration:"none",display:"block",marginBottom:12,wordBreak:"break-all"}}>Inmobiliariabuenfuturo1@gmail.com</a><h4 style={{color:"#F4D03F",fontWeight:700,fontSize:11,marginBottom:8,letterSpacing:1}}>SÍGUENOS</h4><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{SOCIALS.map(s=><a key={s.n} href={s.u} target="_blank" rel="noopener noreferrer" className="so" title={s.n} style={{background:s.c}}><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d={s.d}/></svg></a>)}</div></div>
          </div>
          <div style={{maxWidth:1100,margin:"16px auto 0",paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.1)",textAlign:"center",color:"#7F8C8D",fontSize:10}}>2026 Inmobiliaria Buen Futuro. Todos los derechos reservados.</div>
        </section>
      </>}

      {/* ===== CATÁLOGO ===== */}
      {page==="catalogo"&&<section style={{padding:"clamp(14px,3vw,36px) clamp(10px,3vw,16px)",maxWidth:1100,margin:"0 auto",minHeight:"80vh"}}>
        <div className="sort-bar" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:8}}>
          <div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(20px,4vw,28px)",fontWeight:800,color:"#1B2A4A"}}>Catálogo</h2><p style={{color:"#5D6D7E",fontSize:12}}>{filtered.length} inmueble{filtered.length!==1?"s":""}</p></div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:"2px solid #D5DBDB",fontSize:12,fontWeight:600,cursor:"pointer",background:"white"}}>
              <option value="relevancia">Relevancia</option>
              <option value="precio_asc">Precio ↑</option>
              <option value="precio_desc">Precio ↓</option>
              <option value="descuento">Mayor descuento</option>
              <option value="bono">Mayor bono HABI</option>
              <option value="area">Mayor área</option>
            </select>
            {fCount>0&&<button onClick={clearAll} style={{background:"none",border:"1px solid #E65100",color:"#E65100",padding:"6px 10px",borderRadius:14,fontSize:11,fontWeight:600,cursor:"pointer"}}>Quitar filtros ✕</button>}
          </div>
        </div>
        {filtered.length===0?<div style={{textAlign:"center",padding:40}}><div style={{fontSize:48}}>🏠</div><p style={{color:"#7F8C8D",fontSize:14,marginTop:10}}>No se encontraron inmuebles</p><button onClick={clearAll} style={{marginTop:12,padding:"10px 20px",borderRadius:10,border:"none",background:"#1B4F72",color:"white",fontWeight:700,cursor:"pointer"}}>Ver todos</button></div>
        :<div className="cat-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:14}}>{filtered.map((p,i)=><div key={p.nid||i} style={{animation:"slideUp .35s ease "+(i*.04)+"s both"}}><Card p={p} onClick={setSel} featured={isFeat(p)} onSimCredit={prop=>{setSimProperty(prop);setCOpen(true);}} /></div>)}</div>}
      </section>}

      <a className="wf" href={"https://wa.me/"+WA+"?text="+encodeURIComponent("Hola, estoy interesado en los inmuebles de Buen Futuro")} target="_blank" rel="noopener noreferrer"><svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.592-.768-6.39-2.07l-.446-.334-2.633.882.882-2.633-.334-.446A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg></a>

      <FilterPanel open={fOpen} onClose={()=>setFOpen(false)} filters={filters} setFilters={setFilters} onApply={applyF} inv={inv} shareUrl={typeof window!=="undefined"?window.location.origin+buildCatalogURL(applied,search,sort,false,null,true):""} />
      {cOpen&&<CreditSim key={simProperty?.nid||"generic"} property={simProperty} onClose={()=>{setCOpen(false);setSimProperty(null);}} shareUrl={typeof window!=="undefined"?window.location.origin+buildCatalogURL(applied,search,sort,true,simProperty?.nid||null):""} />}
      {sel&&<Modal p={sel} onClose={()=>setSel(null)} onSimCredit={prop=>{setSimProperty(prop);setCOpen(true);}} />}
    </div>
  );
}
