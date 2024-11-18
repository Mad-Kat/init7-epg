import { XMLParser } from "fast-xml-parser";
import { gunzipSync } from "zlib";

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

// Function to compare and list channels
async function compareChannels(xmltvUrl: string, m3uUrl: string) {
  try {
    // Fetch and parse files
    console.log("Fetching XMLTV data...");
    const xmltvContent = await fetchGzippedXml(xmltvUrl);
    console.log("Fetching M3U data...");
    const m3uContent = await fetchM3u(m3uUrl);

    // Parse XMLTV channels
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseAttributeValue: false,
    });

    const xmlObj = parser.parse(xmltvContent);

    // Debug XML structure
    console.log(
      "XML Structure:",
      JSON.stringify(xmlObj, null, 2).slice(0, 1000),
    );

    // Find the TV content
    const tvContent = xmlObj?.tv;

    if (!tvContent) {
      throw new Error(
        "TV content not found in XML. Available keys: " +
          Object.keys(xmlObj).join(", "),
      );
    }

    // Get XMLTV channels
    const xmltvChannels = tvContent.channel.map((channel: any) => {
      const displayName = channel["display-name"];
      const name = Array.isArray(displayName)
        ? displayName[0]["#text"]
        : displayName["#text"];

      return {
        id: channel["@_id"],
        name: name,
      };
    });

    // Get M3U channels
    const m3uChannels: { id: string; name: string }[] = [];
    m3uContent.split("\n").forEach((line) => {
      const channelInfo = extractM3uChannelInfo(line);
      if (channelInfo) {
        m3uChannels.push(channelInfo);
      }
    });

    // Sort both arrays by name for easier comparison
    xmltvChannels.sort((a, b) => a.name.localeCompare(b.name));
    m3uChannels.sort((a, b) => a.name.localeCompare(b.name));

    // Print comparison
    console.log("\nChannel Mappings:\n");
    console.log("const channelMappings: Record<string, string> = {");

    xmltvChannels.forEach((xmltvChannel) => {
      // Try to find exact match first (ignoring country suffix)
      const exactMatch = m3uChannels.find(
        (m3uChannel) =>
          m3uChannel.name.toLowerCase() === xmltvChannel.name.toLowerCase(),
      );

      // If no exact match, try fuzzy match
      const fuzzyMatch = !exactMatch
        ? m3uChannels.find((m3uChannel) => {
            const xmltvNormalized = xmltvChannel.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            const m3uNormalized = m3uChannel.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            return (
              xmltvNormalized.includes(m3uNormalized) ||
              m3uNormalized.includes(xmltvNormalized)
            );
          })
        : null;

      const match = exactMatch || fuzzyMatch;

      if (match) {
        console.log(
          `    '${xmltvChannel.id}': '${match.id}', // ${xmltvChannel.name} => ${match.name}`,
        );
      } else {
        console.log(
          `    '${xmltvChannel.id}': '', // ${xmltvChannel.name} (NO MATCH FOUND)`,
        );
      }
    });

    console.log("};");

    // Print statistics
    const totalChannels = xmltvChannels.length;
    const matchedChannels = xmltvChannels.filter((xmltvChannel) =>
      m3uChannels.some((m3uChannel) => {
        const xmltvNormalized = xmltvChannel.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const m3uNormalized = m3uChannel.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        return (
          xmltvNormalized.includes(m3uNormalized) ||
          m3uNormalized.includes(xmltvNormalized)
        );
      }),
    ).length;

    console.log(`\nStatistics:`);
    console.log(`Total XMLTV channels: ${totalChannels}`);
    console.log(`Matched channels: ${matchedChannels}`);
    console.log(`Unmatched channels: ${totalChannels - matchedChannels}`);
    console.log(
      `Match rate: ${((matchedChannels / totalChannels) * 100).toFixed(1)}%`,
    );
  } catch (error) {
    console.error("Error:", error);
    console.error("Details:", error.stack);
  }
}

// URLs
const xmltvUrl =
  "https://github.com/mathewmeconry/TV7_EPG_Data/raw/master/tv7_init7_epg.xml.gz";
const m3uUrl = "https://api.init7.net/tvchannels.m3u";

// Run the comparison
compareChannels(xmltvUrl, m3uUrl);
