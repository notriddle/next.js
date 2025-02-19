import path from 'path'
import { createNext, FileRef } from 'e2e-utils'
import { NextInstance } from 'test/lib/next-modes/base'
import webdriver from 'next-webdriver'
import { check, renderViaHTTP } from 'next-test-utils'

describe('app-dir root layout', () => {
  const isDev = (global as any).isNextDev

  if ((global as any).isNextDeploy) {
    it('should skip next deploy for now', () => {})
    return
  }

  if (process.env.NEXT_TEST_REACT_VERSION === '^17') {
    it('should skip for react v17', () => {})
    return
  }
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: {
        app: new FileRef(path.join(__dirname, 'root-layout/app')),
        'next.config.js': new FileRef(
          path.join(__dirname, 'root-layout/next.config.js')
        ),
      },
      dependencies: {
        react: 'experimental',
        'react-dom': 'experimental',
      },
    })
  })
  afterAll(() => next.destroy())

  if (isDev) {
    describe('Missing required tags', () => {
      it('should error on page load', async () => {
        const outputIndex = next.cliOutput.length
        renderViaHTTP(next.url, '/missing-tags').catch(() => {})
        await check(
          () => next.cliOutput.slice(outputIndex),
          /Missing required root layout tags: html, head, body/
        )
      })

      it('should error on page navigation', async () => {
        const outputIndex = next.cliOutput.length
        const browser = await webdriver(next.url, '/has-tags')
        await browser.elementByCss('a').click()

        await check(
          () => next.cliOutput.slice(outputIndex),
          /Missing required root layout tags: html, head, body/
        )
      })
    })
  }

  describe('Should do a mpa navigation when switching root layout', () => {
    it('should work with basic routes', async () => {
      const browser = await webdriver(next.url, '/basic-route')

      expect(await browser.elementById('basic-route').text()).toBe(
        'Basic route'
      )
      await browser.eval('window.__TEST_NO_RELOAD = true')

      // Navigate to page with same root layout
      await browser.elementByCss('a').click()
      expect(
        await browser.waitForElementByCss('#inner-basic-route').text()
      ).toBe('Inner basic route')
      expect(await browser.eval('window.__TEST_NO_RELOAD')).toBeTrue()

      // Navigate to page with different root layout
      await browser.elementByCss('a').click()
      expect(await browser.waitForElementByCss('#route-group').text()).toBe(
        'Route group'
      )
      expect(await browser.eval('window.__TEST_NO_RELOAD')).toBeUndefined()
    })

    it('should work with route groups', async () => {
      const browser = await webdriver(next.url, '/route-group')

      expect(await browser.elementById('route-group').text()).toBe(
        'Route group'
      )
      await browser.eval('window.__TEST_NO_RELOAD = true')

      // Navigate to page with same root layout
      await browser.elementByCss('a').click()
      expect(
        await browser.waitForElementByCss('#nested-route-group').text()
      ).toBe('Nested route group')
      expect(await browser.eval('window.__TEST_NO_RELOAD')).toBeTrue()

      // Navigate to page with different root layout
      await browser.elementByCss('a').click()
      expect(await browser.waitForElementByCss('#parallel-one').text()).toBe(
        'One'
      )
      expect(await browser.waitForElementByCss('#parallel-two').text()).toBe(
        'Two'
      )
      expect(await browser.eval('window.__TEST_NO_RELOAD')).toBeUndefined()
    })

    it('should work with parallel routes', async () => {
      const browser = await webdriver(next.url, '/with-parallel-routes')

      expect(await browser.elementById('parallel-one').text()).toBe('One')
      expect(await browser.elementById('parallel-two').text()).toBe('Two')
      await browser.eval('window.__TEST_NO_RELOAD = true')

      // Navigate to page with same root layout
      await browser.elementByCss('a').click()
      expect(
        await browser.waitForElementByCss('#parallel-one-inner').text()
      ).toBe('One inner')
      expect(await browser.eval('window.__TEST_NO_RELOAD')).toBeTrue()

      // Navigate to page with different root layout
      await browser.elementByCss('a').click()
      expect(await browser.waitForElementByCss('#dynamic-hello').text()).toBe(
        'dynamic hello'
      )
      expect(await browser.eval('window.__TEST_NO_RELOAD')).toBeUndefined()
    })

    it('should work with dynamic routes', async () => {
      const browser = await webdriver(next.url, '/dynamic/first/route')

      expect(await browser.elementById('dynamic-route').text()).toBe(
        'dynamic route'
      )
      await browser.eval('window.__TEST_NO_RELOAD = true')

      // Navigate to page with same root layout
      await browser.elementByCss('a').click()
      expect(
        await browser.waitForElementByCss('#dynamic-second-hello').text()
      ).toBe('dynamic hello')
      expect(await browser.eval('window.__TEST_NO_RELOAD')).toBeTrue()

      // Navigate to page with different root layout
      await browser.elementByCss('a').click()
      expect(
        await browser.waitForElementByCss('#inner-basic-route').text()
      ).toBe('Inner basic route')
      expect(await browser.eval('window.__TEST_NO_RELOAD')).toBeUndefined()
    })
  })
})
