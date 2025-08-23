const { google } = require('googleapis');
const logger = require('../middleware/logger');

class GMeetService {
  constructor() {
    this.calendar = null;
    this.initializeCalendar();
  }

  // Initialize Google Calendar API
  async initializeCalendar() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './google-service-account.json',
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ]
      });

      this.calendar = google.calendar({ version: 'v3', auth });
    } catch (error) {
      logger.error('GMeet service initialization error:', error);
      throw new Error('Failed to initialize Google Meet service');
    }
  }

  // Create a Google Meet event
  async createGMeetEvent({
    summary,
    description,
    startTime,
    endTime,
    attendees = [],
    location = null,
    reminders = null
  }) {
    try {
      if (!this.calendar) {
        await this.initializeCalendar();
      }

      const event = {
        summary,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        },
        attendees: attendees.map(attendee => ({
          email: attendee.email,
          displayName: attendee.displayName || attendee.email
        })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: reminders || {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 15 } // 15 minutes before
          ]
        }
      };

      if (location) {
        event.location = location;
      }

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      const createdEvent = response.data;
      
      return {
        id: createdEvent.id,
        hangoutLink: createdEvent.hangoutLink,
        joinUrl: createdEvent.hangoutLink,
        startTime: createdEvent.start.dateTime,
        endTime: createdEvent.end.dateTime,
        attendees: createdEvent.attendees || [],
        summary: createdEvent.summary,
        description: createdEvent.description
      };
    } catch (error) {
      logger.error('GMeet create event error:', error);
      throw new Error('Failed to create Google Meet event');
    }
  }

  // Update a Google Meet event
  async updateGMeetEvent(eventId, {
    summary,
    description,
    startTime,
    endTime,
    attendees = null,
    location = null
  }) {
    try {
      if (!this.calendar) {
        await this.initializeCalendar();
      }

      const updateData = {};

      if (summary) updateData.summary = summary;
      if (description) updateData.description = description;
      if (startTime) {
        updateData.start = {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC'
        };
      }
      if (endTime) {
        updateData.end = {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        };
      }
      if (attendees) {
        updateData.attendees = attendees.map(attendee => ({
          email: attendee.email,
          displayName: attendee.displayName || attendee.email
        }));
      }
      if (location) updateData.location = location;

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId,
        resource: updateData,
        sendUpdates: 'all'
      });

      const updatedEvent = response.data;
      
      return {
        id: updatedEvent.id,
        hangoutLink: updatedEvent.hangoutLink,
        joinUrl: updatedEvent.hangoutLink,
        startTime: updatedEvent.start.dateTime,
        endTime: updatedEvent.end.dateTime,
        attendees: updatedEvent.attendees || [],
        summary: updatedEvent.summary,
        description: updatedEvent.description
      };
    } catch (error) {
      logger.error('GMeet update event error:', error);
      throw new Error('Failed to update Google Meet event');
    }
  }

  // Delete a Google Meet event
  async deleteGMeetEvent(eventId) {
    try {
      if (!this.calendar) {
        await this.initializeCalendar();
      }

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all'
      });

      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      logger.error('GMeet delete event error:', error);
      throw new Error('Failed to delete Google Meet event');
    }
  }

  // Get event details
  async getGMeetEvent(eventId) {
    try {
      if (!this.calendar) {
        await this.initializeCalendar();
      }

      const response = await this.calendar.events.get({
        calendarId: 'primary',
        eventId
      });

      const event = response.data;
      
      return {
        id: event.id,
        hangoutLink: event.hangoutLink,
        joinUrl: event.hangoutLink,
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        attendees: event.attendees || [],
        summary: event.summary,
        description: event.description,
        status: event.status,
        created: event.created,
        updated: event.updated
      };
    } catch (error) {
      logger.error('GMeet get event error:', error);
      throw new Error('Failed to get Google Meet event');
    }
  }

  // List upcoming events
  async listUpcomingEvents(maxResults = 10) {
    try {
      if (!this.calendar) {
        await this.initializeCalendar();
      }

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
        conferenceDataVersion: 1
      });

      return response.data.items
        .filter(event => event.hangoutLink) // Only return events with Meet links
        .map(event => ({
          id: event.id,
          hangoutLink: event.hangoutLink,
          joinUrl: event.hangoutLink,
          startTime: event.start.dateTime,
          endTime: event.end.dateTime,
          attendees: event.attendees || [],
          summary: event.summary,
          description: event.description
        }));
    } catch (error) {
      logger.error('GMeet list events error:', error);
      return [];
    }
  }

  // Add attendee to existing event
  async addAttendee(eventId, attendee) {
    try {
      if (!this.calendar) {
        await this.initializeCalendar();
      }

      const event = await this.getGMeetEvent(eventId);
      const attendees = event.attendees || [];
      
      // Check if attendee already exists
      const existingAttendee = attendees.find(a => a.email === attendee.email);
      if (existingAttendee) {
        return event; // Attendee already exists
      }

      attendees.push({
        email: attendee.email,
        displayName: attendee.displayName || attendee.email
      });

      return await this.updateGMeetEvent(eventId, { attendees });
    } catch (error) {
      logger.error('GMeet add attendee error:', error);
      throw new Error('Failed to add attendee to Google Meet event');
    }
  }

  // Remove attendee from existing event
  async removeAttendee(eventId, attendeeEmail) {
    try {
      if (!this.calendar) {
        await this.initializeCalendar();
      }

      const event = await this.getGMeetEvent(eventId);
      const attendees = event.attendees || [];
      
      const filteredAttendees = attendees.filter(a => a.email !== attendeeEmail);
      
      return await this.updateGMeetEvent(eventId, { attendees: filteredAttendees });
    } catch (error) {
      logger.error('GMeet remove attendee error:', error);
      throw new Error('Failed to remove attendee from Google Meet event');
    }
  }

  // Generate meeting link without creating calendar event
  async generateMeetLink() {
    try {
      // Create a temporary event to get a Meet link
      const tempEvent = {
        summary: 'Temporary Meeting',
        start: {
          dateTime: new Date().toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
          timeZone: 'UTC'
        },
        conferenceData: {
          createRequest: {
            requestId: `temp-meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: tempEvent,
        conferenceDataVersion: 1
      });

      const meetLink = response.data.hangoutLink;

      // Delete the temporary event
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: response.data.id
      });

      return meetLink;
    } catch (error) {
      logger.error('GMeet generate link error:', error);
      throw new Error('Failed to generate Google Meet link');
    }
  }

  // Check if user has access to event
  async checkEventAccess(eventId, userEmail) {
    try {
      if (!this.calendar) {
        await this.initializeCalendar();
      }

      const event = await this.getGMeetEvent(eventId);
      const attendees = event.attendees || [];
      
      return attendees.some(attendee => attendee.email === userEmail);
    } catch (error) {
      logger.error('GMeet check access error:', error);
      return false;
    }
  }

  // Get meeting statistics (if available)
  async getMeetingStats(eventId) {
    try {
      // This would require additional Google Meet API access
      // For now, return basic event info
      const event = await this.getGMeetEvent(eventId);
      
      return {
        eventId,
        startTime: event.startTime,
        endTime: event.endTime,
        attendeeCount: event.attendees.length,
        status: event.status,
        // Additional stats would be available with Meet API
        duration: new Date(event.endTime) - new Date(event.startTime)
      };
    } catch (error) {
      logger.error('GMeet get stats error:', error);
      return null;
    }
  }
}

// Export singleton instance
const gmeetService = new GMeetService();

// Export individual functions for easier testing
const createGMeetEvent = (params) => gmeetService.createGMeetEvent(params);
const updateGMeetEvent = (eventId, params) => gmeetService.updateGMeetEvent(eventId, params);
const deleteGMeetEvent = (eventId) => gmeetService.deleteGMeetEvent(eventId);
const getGMeetEvent = (eventId) => gmeetService.getGMeetEvent(eventId);
const generateMeetLink = () => gmeetService.generateMeetLink();

module.exports = {
  gmeetService,
  createGMeetEvent,
  updateGMeetEvent,
  deleteGMeetEvent,
  getGMeetEvent,
  generateMeetLink
};
