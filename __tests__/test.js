const puppeteer = require('puppeteer');

describe(
    '/ (Home Page)',
    () => {
        let page;
        let browser;
        
        beforeAll(async () => {
            browser = await puppeteer.launch({
                headless: false,
                args: [
                    '--start-maximized',
                  ],
            });
            global.__BROWSER__ = browser
        }, 10000);

        beforeEach(async () => {
            page = await browser.newPage({
                waitUntil: 'domcontentloaded'
            });
        
            await page.goto('http://localhost:8080');
            await page.setViewport({ width: 1080, height: 1024 })

            const maps = await page.evaluate(() => ymaps.ready())

            const inputElement = await page.$eval('input', e => e ? true : false);
            const mapElement = await page.$eval('#map', e => e ? true : false);
            const uiElement = await page.$eval('.ui', e => e ? true : false);

            expect (inputElement).toBe(true);
            expect (mapElement).toBe(true);
            expect (uiElement).toBe(true);
        }, 10000);

        afterEach(() => {
            page.close()
        });

        afterAll(() => browser.close());

        test('Значение в инпуте меняется при вводе', async () => {
            await page.$eval('input', e => e.click());
            await page.type('input', 'Moscow');
            const inputValue = await page.evaluate(() => {
                return document.querySelector('input').value;
              });

            expect (inputValue).toBe('Moscow');

        });

        test('При нажатии Enter с валидным значением появляется элемент списка', async () => {
            await page.$eval('input', e => e.click());
            await page.type('input', 'Moscow');
            await page.keyboard.press('Enter');

            await page.waitForSelector('.point', { timeout: 5000, visible: true });

            const point = await page.evaluate(() => {
                return document.querySelector('.point') ? true : false;
              });

            expect (point).toBe(true)

        });

        test('При нажатии Enter с невалидным значением элемент списка не появляется', async () => {
            await page.$eval('input', e => e.click());
            await page.type('input', 'asdasdasdasd');
            await page.keyboard.press('Enter');

            const point = await page.evaluate(() => {
                return document.querySelector('.point') ? true : false;
              });

            expect (point).toBe(false)
        });

        test('При нажатии на крестик элемент списка исчезает', async () => {
            await page.$eval('input', e => e.click());
            await page.type('input', 'Moscow');
            await page.keyboard.press('Enter');

            const point = await page.evaluate(() => {
                return document.querySelector('.point') ? true : false;
              });

            await page.waitForSelector('.cross-icon',{ timeout: 3000, visible: true });

            await page.$eval('.cross-icon', e => e.click());

            expect (point).toBe(false)
        });
    },
    20000
  );