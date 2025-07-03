import fetch from 'node-fetch';
import robotsParser from 'robots-parser';

export const USER_AGENT = "ModelContextProtocol/1.0 (Autonomous; +https://github.com/modelcontextprotocol/servers)";
export const BASE_URL = "https://www.airbnb.com";

let robotsTxtContent = "";

export async function fetchRobotsTxt() {
  try {
    const response = await fetch(`${BASE_URL}/robots.txt`);
    robotsTxtContent = await response.text();
    console.log('Robots.txt fetched successfully');
  } catch (error) {
    console.error("Error fetching robots.txt:", error);
    robotsTxtContent = ""; // Empty robots.txt means everything is allowed
  }
}

export function isPathAllowed(path) {
  if (!robotsTxtContent) {
    return true; // If we couldn't fetch robots.txt, assume allowed
  }

  const robots = robotsParser(`${BASE_URL}/robots.txt`, robotsTxtContent);
  const allowed = robots.isAllowed(path, USER_AGENT);
  
  if (!allowed) {
    console.error(`Path ${path} is disallowed by robots.txt`);
  }
  
  return allowed;
}
