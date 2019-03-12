import { createSelector } from 'reselect';
import {
  includes,
  filter,
  map, 
  reduce,
} from 'lodash';
import moment from 'moment';
import { 
  LIVE_EVENTS_TAB, 
  PENDING_EVENTS_TAB, 
  STATES_LEGS 
} from '../../constants';
import { getAllOldEventsAsList, getAllEvents, getAllEventsAsList, getAllOldEvents } from '../events/selectors';

export const getPendingOrLiveTab = state => state.selections.selectedEventTab;
export const getActiveFederalOrState = state => state.selections.federalOrState;
export const getMode = state => state.selections.mode;
export const getCurrentHashLocation = state => state.selections.currentHashLocation;
export const getOldEventsActiveFederalOrState = state => state.selections.federalOrStateOldEvents;
export const getDateRange = state => state.selections.dateLookupRange;
export const getStatesToFilterArchiveBy = state => state.selections.filterByState;
export const includeLiveEventsInLookup = state => state.selections.includeLiveEvents;

export const getLiveEventUrl = createSelector([getActiveFederalOrState], (federalOrState) => {
  if (includes(STATES_LEGS, federalOrState)) {
    return `state_townhalls/${federalOrState}`;
  }
  return 'townHalls';
});

export const getSubmissionUrl = createSelector([getActiveFederalOrState], (federalOrState) => {
  if (includes(STATES_LEGS, federalOrState)) {
    return `state_legislators_user_submission/${federalOrState}`;
  }
  return 'UserSubmission';
});

export const getArchiveUrl = createSelector([getActiveFederalOrState], (federalOrState) => {
  if (includes(STATES_LEGS, federalOrState)) {
    return `state_townhalls_archive/${federalOrState}`;
  }
  return 'archive_clean';
});

export const getEventsToShowUrl = createSelector([getPendingOrLiveTab, getSubmissionUrl, getLiveEventUrl], 
    (liveOrPending, submissionUrl, liveEventUrl) => {
    if (liveOrPending === LIVE_EVENTS_TAB) {
        return liveEventUrl
    } else if (liveOrPending === PENDING_EVENTS_TAB) {
        return submissionUrl
    }
    return null;
});

export const getPeopleNameUrl = createSelector([getActiveFederalOrState, getMode], (federalOrState, mode) => {
  if (mode === 'candidate') {
    return 'candidate_keys';
  }
  if (includes(STATES_LEGS, federalOrState)) {
    return `state_legislators_id/${federalOrState}`;
  }
  return 'mocID';
});

export const getPeopleDataUrl = createSelector([getActiveFederalOrState, getMode], (federalOrState, mode) => {
  if (mode === 'candidate') {
    return 'candidate_data';
  }
  if (includes(STATES_LEGS, federalOrState)) {
    return `state_legislators_data/${federalOrState}`;
  }
  return 'mocData';
});

export const getFilteredArchivedEvents = createSelector(
  [
    includeLiveEventsInLookup, 
    getStatesToFilterArchiveBy, 
    getAllOldEvents, 
    getAllEventsAsList
  ], 
  (includeLive, states, oldEvents, liveEvents) => {
    const allEvents = includeLive ? [...oldEvents, ...liveEvents] : oldEvents;
    if (!states.length) {
      return allEvents;
    }
    return filter(allEvents, (event) => {
      return includes(states, event.state);
    })
});

export const getEventsAsDownloadObjects= createSelector([getFilteredArchivedEvents], (allEvents) => {
   return map(allEvents, eventData => {

         const convertedTownHall = {};

         convertedTownHall.Member = eventData.displayName || eventData.Member;
         convertedTownHall.Event_Name = eventData.eventName ? eventData.eventName : ' ';
         convertedTownHall.Location = eventData.Location ? eventData.Location : ' ';
         convertedTownHall.Meeting_Type = eventData.meetingType;
         let district = eventData.district ? '-' + eventData.district : ' ';
         convertedTownHall.District = eventData.state + district;
         convertedTownHall.govtrack_id = eventData.govtrack_id || ' ';
         convertedTownHall.Party = eventData.party;
         convertedTownHall.State = eventData.state;
         convertedTownHall.State_name = eventData.stateName ? eventData.stateName : eventData.State;
         if (eventData.repeatingEvent) {
           convertedTownHall.Repeating_Event = eventData.repeatingEvent;
           convertedTownHall.Date = ' ';
         } else if (eventData.dateString) {
           convertedTownHall.Repeating_Event = ' ';
           convertedTownHall.Date = eventData.dateString;
         } else {
           convertedTownHall.Repeating_Event = ' ';
           convertedTownHall.Date = moment(eventData.dateObj).format('ddd, MMM D YYYY');
         }
         convertedTownHall.Time_Start = eventData.Time;
         convertedTownHall.Time_End = eventData.timeEnd || ' ';
         convertedTownHall.Time_Zone = eventData.timeZone || ' ';
         convertedTownHall.Zone_ID = eventData.zoneString || ' ';
         convertedTownHall.Address = eventData.address;
         convertedTownHall.Notes = eventData.Notes ? eventData.Notes.replace(/"/g, '\'') : ' ';
         convertedTownHall.Map_Icon = eventData.iconFlag;
         convertedTownHall.Link = eventData.link || 'https://townhallproject.com/?eventId=' + eventData.eventId;
         convertedTownHall.Link_Name = eventData.linkName || ' ';
         convertedTownHall.dateNumber = eventData.yearMonthDay;
         return convertedTownHall;
    })
})

export const getDataForArchiveChart = createSelector(
  [getFilteredArchivedEvents],
  (allEvents) => {
    if (!allEvents) {
      return [];
    }
    return map(reduce(allEvents, (acc, cur) => {
      const party = cur.party ? cur.party.substring(0, 1) : 'None';
      if (acc[party] >= 0) {
        acc[party] = acc[party] + 1;
      }
      return acc;
    }, {
      D: 0,
      R: 0,
      I: 0,
      None: 0,
    }), (value, key) => {
      return {
        party: key,
        value
      }
    })
  }
)