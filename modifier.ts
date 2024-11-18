import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { gunzipSync, gzipSync } from "zlib";

// Manual corrections and mappings for all channels
const channelMappings: Record<string, string> = {
  // Swiss channels
  srf1: "SRF1.ch",
  srfzwei: "SRFzwei.ch",
  srfinfo: "SRFinfo.ch",
  tv24: "TV24.ch",
  tv25: "TV25.ch",
  swiss1: "Swiss1.ch",
  telem1: "TeleM1.ch",
  teletop: "TeleTop.ch",
  telez: "TeleZ.ch",
  tele1: "Tele1.ch",
  shf: "SchaffhauserFernsehen.ch",
  teled: "TeleD.ch",
  kanal9: "Kanal9.ch",
  bluezoomd: "BlueZoomD.ch",
  bluezoomf: "BlueZoomF.ch",
  startv: "StarTV.ch",
  tvsuisseplus: "TVSuissePlus.ch",
  rts1: "RTS1.ch",
  rts2: "RTS2.ch",
  rsila1: "RSILa1.ch",
  rsila2: "RSILa2.ch",
  canalalphaju: "CanalAlphaJU.ch",
  canalalphane: "CanalAlphaNE.ch",

  // German channels
  daserste: "DasErste.de",
  "sat.1": "SAT1.de",
  prosieben: "ProSiebenSchweiz.ch",
  kabeleins: "kabeleinsSchweiz.ch",
  prosiebenmaxx: "ProSiebenMaxx.de",
  "sat.1gold": "SAT1Gold.de",
  ardalpha: "ARDalpha.de",
  wdrfernsehen: "WDRFernsehenKoln.de",
  rbbberlin: "rbbFernsehenBerlin.de",
  hrfernsehen: "hrfernsehen.de",
  srfernsehen: "SRFernsehen.de",
  kabeleinsdoku: "kabeleinsDoku.de",
  n24doku: "N24Doku.de",
  tele5: "TELE5.de",
  "auftanken.tv": "AuftankenTV.ch",
  bibeltv: "BibelTV.de",
  deluxemusic: "DeluxeMusic.de",
  toggoplus: "TOGGOplus.de",
  comedycentral: "ComedyCentral.de",
  eurosport1: "Eurosport1.de",
  disneychannel: "DisneyChannel.de",

  // Austrian channels
  orf1: "ORF1.at",
  orf2: "ORF2.at",
  servustv: "ServusTV.at",

  // French channels
  tf1: "TF1Switzerland.ch",
  france2: "France2.fr",
  france3: "France3.fr",
  france4: "France4.fr",
  france5: "France5.fr",
  nrj12: "NRJ12.fr",
  rmcstory: "RMCStory.fr",
  bfmtv: "BFMTV.fr",
  carac1: "RougeTV.ch",
  carac2: "OneTV.ch",
  carac3: "LFMTV.ch",

  // Italian channels
  rai1: "Rai1.it",
  rai2: "Rai2.it",
  rai3: "Rai3.it",
  rai4: "Rai4.it",
  rai5: "Rai5.it",
  raipremium: "RaiPremium.it",
  raimovie: "RaiMovie.it",
  la7: "LA7.it",
  la7d: "LA7d.it",
  italia1: "Italia1.it",
  rainews24: "RaiNews24.it",
  "raisport+": "RaiSportHD.it",
  raigulp: "RaiGulp.it",
  raiyoyo: "RaiYoyo.it",
  raiscuola: "RaiScuola.it",
  raistoria: "RaiStoria.it",
  la5: "La5.it",
  realtime: "RealTime.it",
  deejaytv: "DeejayTV.it",

  // UK channels
  bbctwo: "BBCTwo.uk",
  channel4: "Channel4.uk",
  channel5: "Channel5.uk",
  itv2: "ITV2.uk",
  itv3: "ITV3.uk",
  itv4: "ITV4.uk",
  film4: "Film4.uk",
  "5star": "5STAR.uk",
  "5usa": "5USA.uk",
  bbcnews: "BBCNews.uk",
  skynews: "SkyNewsInternational.uk",

  // Other international channels
  cnninternational: "CNNInternationalEurope.us",
  bloombergtv: "BloombergTVEurope.uk",
  aljazeeraenglish: "AlJazeera.qa",
  fashiontv: "FashionTVEurope.fr",
  "tveint.": "TVEInternacionalEuropeAsia.es",
  canal24horas: "24Horas.es",
  "rtpint.": "RTPInternacional.pt",
  tvrinternational: "TVRInternational.ro",
  tvppolonia: "TVPPolonia.pl",
  rtk1: "RTK1.xk",
  rtsh3: "RTSH3.al",

  // Turkish channels
  trtturk: "TRTTurk.tr",
  kanal7avrupa: "Kanal7.tr",
  eurod: "EuroD.tr",
  trtspor: "TRTSpor.tr",
  trthaber: "TRTHaber.tr",
  trtcocuk: "TRTCocuk.tr",
  tgrteu: "TGRTEU.tr",

  // Previously defined manual corrections
  "3+": "3plus.ch",
  "4+": "4plus.ch",
  "5+": "5Plus.ch",
  "6+": "6Plus.ch",
  "7+/nickch": "7PlusNickSchweiz.ch",
  bbcworldnews: "BBCNewsEurope.uk",
  brfernsehensüd: "BRFernsehenSud.de",
  "canal+enclair": "CanalPlus.fr",
  canal8: "C8.fr",
  latélé: "LaTele.ch",
  lémanbleu: "LemanBleu.ch",
  mdrsachsen: "MDRFernsehenSachsen.de",
  ndrfsnds: "NDRFernsehenHamburg.de",
  puls8: "PulsAcht.ch",
  "n-tv": "ntv.de",
  rete4: "Rete4.it",
  swrbw: "SWRFernsehenBadenWurttemberg.de",
  telebärn: "TeleBarn.ch",
  téléversoix: "Televersoix.ch",
  telezüri: "TeleZuri.ch",
  tvsüdost: "Sudostschweiz.ch",
  tv5mondeeurope: "TV5MondeFranceBelgiumSwitzerlandMonaco.fr",
  "meteonews.tv": "WettercomTV.de",
  france24: "France24French.fr",
  france24e: "France24English.fr",
  dweurope: "DWEnglish.de",
  rtshsat: "RTSSvet.rs",
  cnntürk: "CNNTurk.tr",
  dreamtürk: "DreamTurk.tr",
  dokusat: "DOKUSAT",

  // German channels
  zdf: "ZDF.de",
  rtl: "RTL.de",
  "3sat": "3sat.de",
  arted: "arte.de",
  s1: "S1.ch",
  rtlzwei: "RTLZwei.de",
  vox: "VOX.de",
  one: "One.de",
  zdfneo: "ZDFneo.de",
  nitro: "Nitro.de",
  sixx: "sixx.de",
  zdfinfo: "ZDFinfo.de",
  phoenix: "phoenix.de",
  tagesschau24: "tagesschau24.de",
  welt: "WELT.de",
  sport1: "Sport1.de",
  superrtl: "RTLSuper.de",
  kika: "KiKA.de",
  mtv: "MTV.de",
  dmax: "DMAX.de",
  tlc: "TLC.de",
  anixe: "AnixeHDSerie.de",

  // Swiss regional channels
  telebasel: "Telebasel.ch",
  tvo: "TVO.ch",
  telebielingue: "TeleBielingue.ch",
  teleticino: "TeleTicino.ch",
  teleswizz: "TeleSwizz.ch",
  tvm3: "TVM3.ch",

  // French channels
  m6: "M6Switzerland.ch",
  artef: "arte.fr",
  w9: "W9Switzerland.ch",
  tmcmontecarlo: "TMC.fr",
  tfx: "TFXSwitzerland.ch",
  "6ter": "6terSwitzerland.ch",
  rtl9: "RTL9.lu",
  euronewsf: "EuronewsFrench.fr",
  gulli: "Gulli.fr",

  // Italian channels
  canale5: "Canale5.it",
  cine34: "Cine34.it",
  tv2000: "TV2000.it",
  telelombardia: "Telelombardia.it",
  euronewsi: "EuronewsItalian.fr",
  tgcom24: "TGCom24.it",
  supertennis: "SuperTennis.it",
  sportitalia: "Sportitalia.it",
  boing: "Boing.it",
  "super!": "Super.it",
  frisbee: "Frisbee.it",
  k2: "K2.it",
  cartoonito: "Cartoonito.it",
  focus: "Focus.it",
  iris: "Iris.it",
  dmaxitalia: "DMAX.it",
  nove: "Nove.it",
  giallo: "Giallo.it",
  radioitaliatv: "RadioItaliaTV.it",
  "rtl102.5tv": "RTL1025TV.it",

  // UK channels
  bbcone: "BBCOne.uk",
  itv: "ITV1.uk",
  e4: "E4.uk",
  cnbc: "CNBCEurope.uk",
  euronewse: "EuronewsEnglish.fr",
  cbbc: "CBBC.uk",
  cbeebies: "CBeebies.uk",
  travelxp: "TravelXP.uk",
  "more4+1": "More4.uk",

  // Other international channels
  bvntv: "BVN.nl",
  dunatv: "Duna.hu",
  bn: "BNTV.ba",
  tvcgmne: "TVCG.me",
  tv4e: "tv4e.gr",

  // Turkish channels
  haberturk: "Haberturk.tr",
  eurostar: "EuroStar.tr",
  trt1: "TRT1.tr",

  // News channels
  euronewsd: "EuronewsGerman.fr",
};

// Function to extract channel ID from M3U line
function extractM3uChannelInfo(
  line: string,
): { id: string; name: string } | null {
  const tvgNameMatch = line.match(/tvg-name="([^"]+)"/);
  if (tvgNameMatch) {
    return {
      id: tvgNameMatch[1],
      name: tvgNameMatch[1].replace(/\.[a-z]+$/, ""), // Remove country suffix
    };
  }
  return null;
}

// Function to fetch and decompress gzipped content
async function fetchGzippedXml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const decompressed = gunzipSync(new Uint8Array(buffer));
  return new TextDecoder().decode(decompressed);
}

// Function to fetch M3U content
async function fetchM3u(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.text();
}

// Function to write gzipped content
async function writeGzippedFile(content: string, outputPath: string) {
  const compressed = gzipSync(Buffer.from(content));
  await Bun.write(outputPath, compressed);
}

// Function to process and update the XMLTV file
async function updateXmltvIds(
  xmltvUrl: string,
  m3uUrl: string,
  outputPath: string,
) {
  try {
    // Fetch files
    console.log("Fetching XMLTV data...");
    const xmltvContent = await fetchGzippedXml(xmltvUrl);
    console.log("Fetching M3U data...");
    const m3uContent = await fetchM3u(m3uUrl);

    // Parse XMLTV
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseAttributeValue: false,
    });

    // Parse XML and get the TV content
    const xmlObj = parser.parse(xmltvContent);
    const tvContent = xmlObj.tv;

    // Count for statistics
    let totalChannels = 0;
    let updatedChannels = 0;
    const unmappedChannels = new Set<string>();

    // Update channel IDs
    tvContent.channel = tvContent.channel.map((channel: any) => {
      totalChannels++;
      const oldId = channel["@_id"];

      // Check mapping dictionary
      if (channelMappings[oldId]) {
        channel["@_id"] = channelMappings[oldId];
        updatedChannels++;
      } else {
        unmappedChannels.add(oldId);
      }

      return channel;
    });

    // Update programme references
    if (tvContent.programme) {
      tvContent.programme = tvContent.programme.map((programme: any) => {
        const oldChannel = programme["@_channel"];
        if (channelMappings[oldChannel]) {
          programme["@_channel"] = channelMappings[oldChannel];
        }
        return programme;
      });
    }

    // Convert back to XML
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      format: true,
    });
    const updatedXml = builder.build({ tv: tvContent });

    // Write gzipped result
    console.log("Compressing and writing output file...");
    await writeGzippedFile(updatedXml, outputPath);

    // Print statistics
    console.log("\nUpdate Statistics:");
    console.log(`Total channels: ${totalChannels}`);
    console.log(`Updated channels: ${updatedChannels}`);
    console.log(`Unmapped channels: ${unmappedChannels.size}`);
    console.log(
      `Update success rate: ${((updatedChannels / totalChannels) * 100).toFixed(1)}%`,
    );

    if (unmappedChannels.size > 0) {
      console.log("\nUnmapped channels:");
      unmappedChannels.forEach((id) => console.log(`- ${id}`));
    }

    // Get file sizes for comparison
    const originalSize = Buffer.from(xmltvContent).length;
    const compressedSize = await Bun.file(outputPath).size;

    console.log("\nFile size information:");
    console.log(`Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
      `Compression ratio: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`,
    );
    console.log(
      `\nUpdated and compressed XMLTV file has been saved to: ${outputPath}`,
    );
  } catch (error) {
    console.error("Error:", error);
    console.error("Details:", error.stack);
  }
}

// URLs and output path
const xmltvUrl =
  "https://github.com/mathewmeconry/TV7_EPG_Data/raw/master/tv7_init7_epg.xml.gz";
const m3uUrl = "https://api.init7.net/tvchannels.m3u";
const outputPath = "updated_epg.xml.gz"; // Added .gz extension

// Run the update
updateXmltvIds(xmltvUrl, m3uUrl, outputPath);
