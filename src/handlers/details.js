import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { cleanObject, flattenArraysInObject, pickBySchema } from '../utils/util.js';
import { isPathAllowed, USER_AGENT, BASE_URL } from '../utils/robots.js';

const allowSectionSchema = {
  "LOCATION_DEFAULT": {
    lat: true,
    lng: true,
    subtitle: true,
    title: true
  },
  "POLICIES_DEFAULT": {
    title: true,
    houseRulesSections: {
      title: true,
      items: {
        title: true
      }
    }
  },
  "HIGHLIGHTS_DEFAULT": {
    highlights: {
      title: true
    }
  },
  "DESCRIPTION_DEFAULT": {
    htmlDescription: {
      htmlText: true
    }
  },
  "AMENITIES_DEFAULT": {
    title: true,
    seeAllAmenitiesGroups: {
      title: true,
      amenities: {
        title: true
      }
    }
  },
};

export async function handleAirbnbListingDetails(params) {
  const {
    id,
    checkin,
    checkout,
    adults = 1,
    children = 0,
    infants = 0,
    pets = 0,
  } = params;

  // Build listing URL
  const listingUrl = new URL(`${BASE_URL}/rooms/${id}`);
  
  // Add query parameters
  if (checkin) listingUrl.searchParams.append("check_in", checkin);
  if (checkout) listingUrl.searchParams.append("check_out", checkout);
  
  // Add guests
  const adults_int = parseInt(adults.toString());
  const children_int = parseInt(children.toString());
  const infants_int = parseInt(infants.toString());
  const pets_int = parseInt(pets.toString());
  
  const totalGuests = adults_int + children_int;
  if (totalGuests > 0) {
    listingUrl.searchParams.append("adults", adults_int.toString());
    listingUrl.searchParams.append("children", children_int.toString());
    listingUrl.searchParams.append("infants", infants_int.toString());
    listingUrl.searchParams.append("pets", pets_int.toString());
  }

  // Check robots.txt
  const path = listingUrl.pathname + listingUrl.search;
  if (!isPathAllowed(path)) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: "This path is disallowed by Airbnb's robots.txt",
          url: listingUrl.toString()
        }, null, 2)
      }],
      isError: true
    };
  }

  try {
    const response = await fetch(listingUrl.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    
    let details = {};
    
    try {
      const scriptElement = $("#data-deferred-state-0").first();
      const clientData = JSON.parse($(scriptElement).text()).niobeMinimalClientData[0][1];
      const sections = clientData.data.presentation.stayProductDetailPage.sections.sections;
      
      sections.forEach(section => cleanObject(section));
      
      details = sections
        .filter(section => allowSectionSchema.hasOwnProperty(section.sectionId))
        .map(section => {
          return {
            id: section.sectionId,
            ...flattenArraysInObject(pickBySchema(section.section, allowSectionSchema[section.sectionId]))
          };
        });
    } catch (e) {
      console.error('Error parsing listing details:', e);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          listingUrl: listingUrl.toString(),
          details: details
        }, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: error.message,
          listingUrl: listingUrl.toString()
        }, null, 2)
      }],
      isError: true
    };
  }
}
