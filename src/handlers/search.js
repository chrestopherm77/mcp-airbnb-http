import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { cleanObject, flattenArraysInObject, pickBySchema } from '../utils/util.js';
import { isPathAllowed, USER_AGENT, BASE_URL } from '../utils/robots.js';

const allowSearchResultSchema = {
  demandStayListing: {
    id: true,
    description: true,
    location: true,
  },
  badges: {
    text: true,
  },
  structuredContent: {
    mapCategoryInfo: {
      body: true
    },
    mapSecondaryLine: {
      body: true
    },
    primaryLine: {
      body: true
    },
    secondaryLine: {
      body: true
    },
  },
  avgRatingA11yLabel: true,
  listingParamOverrides: true,
  structuredDisplayPrice: {
    primaryLine: {
      accessibilityLabel: true,
    },
    secondaryLine: {
      accessibilityLabel: true,
    },
    explanationData: {
      title: true,
      priceDetails: {
        items: {
          description: true,
          priceString: true
        }
      }
    }
  },
};

export async function handleAirbnbSearch(params) {
  const {
    location,
    placeId,
    checkin,
    checkout,
    adults = 1,
    children = 0,
    infants = 0,
    pets = 0,
    minPrice,
    maxPrice,
    cursor,
  } = params;

  // Build search URL
  const searchUrl = new URL(`${BASE_URL}/s/${encodeURIComponent(location)}/homes`);
  
  // Add parameters
  if (placeId) searchUrl.searchParams.append("place_id", placeId);
  if (checkin) searchUrl.searchParams.append("checkin", checkin);
  if (checkout) searchUrl.searchParams.append("checkout", checkout);
  
  // Add guests
  const adults_int = parseInt(adults.toString());
  const children_int = parseInt(children.toString());
  const infants_int = parseInt(infants.toString());
  const pets_int = parseInt(pets.toString());
  
  const totalGuests = adults_int + children_int;
  if (totalGuests > 0) {
    searchUrl.searchParams.append("adults", adults_int.toString());
    searchUrl.searchParams.append("children", children_int.toString());
    searchUrl.searchParams.append("infants", infants_int.toString());
    searchUrl.searchParams.append("pets", pets_int.toString());
  }
  
  // Add price range
  if (minPrice) searchUrl.searchParams.append("price_min", minPrice.toString());
  if (maxPrice) searchUrl.searchParams.append("price_max", maxPrice.toString());
  
  // Add cursor for pagination
  if (cursor) {
    searchUrl.searchParams.append("cursor", cursor);
  }

  // Check robots.txt
  const path = searchUrl.pathname + searchUrl.search;
  if (!isPathAllowed(path)) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: "This path is disallowed by Airbnb's robots.txt",
          url: searchUrl.toString()
        }, null, 2)
      }],
      isError: true
    };
  }

  try {
    const response = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    
    let staysSearchResults = {};
    
    try {
      const scriptElement = $("#data-deferred-state-0").first();
      const clientData = JSON.parse($(scriptElement).text()).niobeMinimalClientData[0][1];
      const results = clientData.data.presentation.staysSearch.results;
      cleanObject(results);
      
      staysSearchResults = {
        searchResults: results.searchResults
          .map(result => flattenArraysInObject(pickBySchema(result, allowSearchResultSchema)))
          .map(result => {
            const id = atob(result.demandStayListing.id).split(":")[1];
            return { id, url: `${BASE_URL}/rooms/${id}`, ...result };
          }),
        paginationInfo: results.paginationInfo
      };
    } catch (e) {
      console.error('Error parsing search results:', e);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          searchUrl: searchUrl.toString(),
          ...staysSearchResults
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
          searchUrl: searchUrl.toString()
        }, null, 2)
      }],
      isError: true
    };
  }
}
