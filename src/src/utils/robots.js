import fetch from 'node-fetch';

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
    robotsTxtContent = ""; 
  }
}

export function isPathAllowed(path) {
  if (!robotsTxtContent) {
    return true; // Se não conseguimos buscar robots.txt, permitimos tudo
  }
  
  // Análise simples do robots.txt
  const lines = robotsTxtContent.split('\n');
  let currentUserAgent = '';
  let disallowedPaths = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('User-agent:')) {
      currentUserAgent = trimmedLine.split(':')[1].trim();
    } else if (trimmedLine.startsWith('Disallow:') && 
               (currentUserAgent === '*' || currentUserAgent === USER_AGENT)) {
      const disallowedPath = trimmedLine.split(':')[1].trim();
      if (disallowedPath) {
        disallowedPaths.push(disallowedPath);
      }
    }
  }
  
  // Verifica se o caminho é permitido
  for (const disallowedPath of disallowedPaths) {
    if (path.startsWith(disallowedPath)) {
      console.error(`Path ${path} is disallowed by robots.txt`);
      return false;
    }
  }
  
  return true;
}
