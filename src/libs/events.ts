/*
 * NOTE: See the Mixpanel guide in the terra-ui GitHub Wiki for more details:
 *   https://github.com/DataBiosphere/terra-ui/wiki/Mixpanel
 */
const eventList = {
  userRegister: 'user:register',
  userSignIn: 'user:signin',
  userAutoLogout401: 'user:autoLogout401',

  pageView: 'page:view',
  dataLibrary: 'page:view:data-library',
  dar: 'page:view:dar',
}

export default eventList

// Helper type to create BaseMetricsEventName.
type MetricsEventsMap<EventName> = { [key: string]: EventName | MetricsEventsMap<EventName> }
// Union type of all event names configured in eventsList.
type BaseMetricsEventName = typeof eventList extends MetricsEventsMap<infer EventName> ? EventName : never
// Each route has its own page view event, where the event name includes the name of the route.
type PageViewMetricsEventName = `${typeof eventList.pageView}:${string}`

/**
 * Union type of all metrics event names.
 */
export type MetricsEventName = BaseMetricsEventName | PageViewMetricsEventName
