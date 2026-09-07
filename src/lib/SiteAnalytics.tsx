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

export function engagementLink(href:string):'contact_clicked'|'social_clicked'|null {
  try {
    const url=new URL(href);
    if(url.protocol==='mailto:'&&url.pathname.toLowerCase()==='bryce.rambach@gmail.com')return 'contact_clicked';
    if(url.protocol==='https:'&&[
      'x.com/brycerambach','www.linkedin.com/in/bryce-rambach','github.com/brambach'
    ].includes(url.hostname+url.pathname.replace(/\/$/,'')))return 'social_clicked';
  }catch{}
  return null;
}
export function SiteAnalytics(){
  useEffect(()=>{
    trackJourney('visit');
    const clicked=(event:MouseEvent)=>{
      if(event.type==='auxclick'&&event.button!==1)return;
      const anchor=event.target instanceof Element?event.target.closest('a'):null;
      const engagement=anchor?engagementLink(anchor.href):null;
      if(engagement)trackJourney(engagement);
    };
    document.addEventListener('click',clicked);document.addEventListener('auxclick',clicked);
    return()=>{document.removeEventListener('click',clicked);document.removeEventListener('auxclick',clicked);};
  },[]);
  return import.meta.env.PROD ? <Analytics beforeSend={visitorEvent}/> : null;
}
