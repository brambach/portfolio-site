import {useEffect} from 'react';
import {trackJourney} from './journey-stats';
import {Analytics} from '@vercel/analytics/react';
import type {BeforeSendEvent} from '@vercel/analytics';

export function visitorEvent(event:BeforeSendEvent):BeforeSendEvent|null {
  const url=new URL(event.url);
  if(url.pathname.startsWith('/admin'))return null;
  if(!['brycerambach.com','www.brycerambach.com'].includes(url.hostname))return null;
  // Exclude review sessions and keep only campaign attribution in page URLs.
  if(['profile','drivingReview','phoneReview','capture'].some(key=>url.searchParams.has(key)))return null;
  for(const key of [...url.searchParams.keys()]){
    if(!['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].includes(key))url.searchParams.delete(key);
  }
  url.hash='';
  return {...event,url:url.toString()};
}

export function SiteAnalytics(){
  useEffect(()=>{trackJourney('visit');},[]);
  return import.meta.env.PROD ? <Analytics beforeSend={visitorEvent}/> : null;
}
