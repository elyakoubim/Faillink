// dailyScraper.js  – cron bootstrap helper
import cron   from 'node-cron';
import dayjs  from 'dayjs';
import tz     from 'dayjs/plugin/timezone.js';
import utc    from 'dayjs/plugin/utc.js';
import Batch  from './model/BankruptcyBatch.js';
dayjs.extend(utc); dayjs.extend(tz);

// --- tiny log util ---------------------------------------------------
const log = (...a) => process.env.DEBUG_SCRAPER === '1'
  && console.log('[cron]', ...a);

// --- public bootstrap -----------------------------------------------
/**
 * Call once after your DB is connected and the scrapeRange
 * (or scrapeDay) function is in scope.
 *
 * @param {Function} scrapeRange  – async (fromStr, toStr) => {…}
 */
export function initDailyScraper(scrapeRange) {
  const TZ = 'Europe/Brussels';

  // 23:59 Brussels local time – node-cron will auto-handle DST
  cron.schedule('59 23 * * *', async () => {
    const today = dayjs().tz(TZ).format('YYYY-MM-DD');
    log(`running for ${today}`);

    try {
      // scrape one day (adapt if you want a span)
      const data = await scrapeRange(today, today);

      // tag as cron source & persist
      const doc  = await Batch.create({ ...data, from: today, to: today, source: 'cron' });
      log(`saved _id=${doc._id} distinct=${doc.countDistinct}`);

    } catch (err) {
      console.error('[cron] failed:', err.message);
    }
  }, { timezone: TZ });

  console.log('⇢ Daily scraper scheduled for 23:59 Europe/Brussels');
}
