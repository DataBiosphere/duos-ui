/**
 * Turns off zod's compiled parsers before any showcase schema is built. Without this, building the
 * first object schema runs zod's `new Function('')` probe, and the app's CSP (no 'unsafe-eval')
 * reports that on every page once the schemas are in the main bundle (DT-4423). The plain parsers
 * give the same results.
 */
import * as z from 'zod'

z.config({ jitless: true })
