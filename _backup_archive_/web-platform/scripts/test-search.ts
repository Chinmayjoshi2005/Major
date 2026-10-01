import { searchService } from "../src/services/search.service";

(async () => {
  try {
    const res = await searchService.search({ query: 'Smith', type: 'faculty', limit: 10 });
    console.log('search result', res);
  } catch (e) {
    console.error('search error', e);
  }
})();
