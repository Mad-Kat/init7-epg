import { XMLParser } from "fast-xml-parser";
import { gunzipSync } from "zlib";

// Function to get channel ID from XMLTV
function extractXmltvChannelInfo(channel: any): { id: string; name: string } {
  return {
    id: channel["@_id"],
    name: Array.isArray(channel["display-name"])
      ? channel["display-name"][0]["#text"]
      : channel["display-name"]["#text"],
  };
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

// Function to process and update the M3U file
async function updateM3uIds(
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

    // Get XMLTV channels
    const xmlObj = parser.parse(xmltvContent);
    const xmltvChannels = xmlObj.tv.channel.map(extractXmltvChannelInfo);

    // Create a mapping from channel name to XMLTV ID
    const channelNameToId = new Map<string, string>();
    xmltvChannels.forEach((channel) => {
      channelNameToId.set(channel.name.toLowerCase(), channel.id);
    });

    // Process M3U content
    const m3uLines = m3uContent.split("\n");
    const updatedM3uLines = m3uLines.map((line) => {
      if (line.startsWith("#EXTINF:")) {
        // Extract channel name from M3U
        const nameMatch = line.match(/,(.+)$/);
        if (nameMatch) {
          const channelName = nameMatch[1].trim();
          // Try to find matching XMLTV ID
          const xmltvId = channelNameToId.get(channelName.toLowerCase());
          if (xmltvId) {
            // Update tvg-name with XMLTV ID
            return line.replace(/tvg-name="[^"]*"/, `tvg-name="${xmltvId}"`);
          }
        }
      }
      return line;
    });

    // Count statistics
    let totalChannels = 0;
    let updatedChannels = 0;
    const unmappedChannels = new Set<string>();

    m3uLines.forEach((line) => {
      if (line.startsWith("#EXTINF:")) {
        totalChannels++;
        const nameMatch = line.match(/,(.+)$/);
        if (nameMatch) {
          const channelName = nameMatch[1].trim();
          if (!channelNameToId.has(channelName.toLowerCase())) {
            unmappedChannels.add(channelName);
          } else {
            updatedChannels++;
          }
        }
      }
    });

    // Write updated M3U
    await Bun.write(outputPath, updatedM3uLines.join("\n"));

    // Print statistics
    console.log("\nUpdate Statistics:");
    console.log(`Total M3U channels: ${totalChannels}`);
    console.log(`Updated channels: ${updatedChannels}`);
    console.log(`Unmapped channels: ${unmappedChannels.size}`);
    console.log(
      `Update success rate: ${((updatedChannels / totalChannels) * 100).toFixed(1)}%`,
    );

    if (unmappedChannels.size > 0) {
      console.log("\nUnmapped channels:");
      unmappedChannels.forEach((name) => console.log(`- ${name}`));
    }

    console.log(`\nUpdated M3U file has been saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error:", error);
    console.error("Details:", error.stack);
  }
}

// URLs and output path
const xmltvUrl =
  "https://github.com/mathewmeconry/TV7_EPG_Data/raw/master/tv7_init7_epg.xml.gz";
const m3uUrl = "https://api.init7.net/tvchannels.m3u?rp=true";
const outputPath = "updated_channels.m3u";

// Run the update
updateM3uIds(xmltvUrl, m3uUrl, outputPath);
