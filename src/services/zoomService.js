const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../middleware/logger');

class ZoomService {
  constructor() {
    this.baseUrl = 'https://api.zoom.us/v2';
    this.accountId = process.env.ZOOM_ACCOUNT_ID;
    this.clientId = process.env.ZOOM_CLIENT_ID;
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
    this.requestCounter = 0;
    this.tokenCache = null;
    this.tokenExpiry = null;
    this.validateCredentials();
  }

  validateCredentials() {
    if (!this.accountId || !this.clientId || !this.clientSecret) {
      logger.warn('Zoom credentials not fully configured');
    }
  }

  // Generate JWT token for Server-to-Server OAuth
  generateAccessToken() {
    if (this.tokenCache && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.tokenCache;
    }

    try {
      const payload = {
        iss: this.clientId,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
      };

      const token = jwt.sign(payload, this.clientSecret, { algorithm: 'HS256' });
      this.tokenCache = token;
      this.tokenExpiry = Date.now() + 3500 * 1000; // Cache for 58 minutes
      return token;
    } catch (error) {
      logger.error('Error generating Zoom access token:', error);
      throw new Error('Failed to generate Zoom access token');
    }
  }

  // Get Zoom API headers
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.generateAccessToken()}`,
      'Content-Type': 'application/json'
    };
  }

  isOfflineMode() {
    const proxyValues = [
      process.env.HTTP_PROXY,
      process.env.HTTPS_PROXY,
      process.env.http_proxy,
      process.env.https_proxy
    ].filter(Boolean);

    return (
      process.env.ZOOM_MODE === 'mock' ||
      proxyValues.some((value) => /127\.0\.0\.1:9\b|localhost:9\b/.test(value))
    );
  }

  buildOfflineEvent({ summary, description, startTime, endTime, attendees = [] }) {
    const id = `offline-zoom-${Date.now()}-${++this.requestCounter}`;
    const joinUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/video/${id}`;

    return {
      id,
      meetingId: id,
      joinUrl,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      attendees,
      topic: summary,
      agenda: description,
      offline: true
    };
  }

  // Create a Zoom meeting
  async createZoomMeeting({
    summary,
    description,
    startTime,
    endTime,
    attendees = [],
    location = null
  }) {
    try {
      if (this.isOfflineMode()) {
        logger.warn('Zoom external call skipped; using local video room fallback');
        return this.buildOfflineEvent({ summary, description, startTime, endTime, attendees });
      }

      if (!this.accountId || !this.clientId || !this.clientSecret) {
        throw new Error('Zoom credentials not configured');
      }

      const meetingData = {
        topic: summary,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString(),
        duration: Math.ceil((endTime - startTime) / 60000), // Duration in minutes
        timezone: 'UTC',
        agenda: description,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          waiting_room: false,
          audio: 'both',
          authentication_option: 'domain',
          allow_multiple_devices: true
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/users/me/meetings`,
        meetingData,
        { headers: this.getHeaders() }
      );

      const meeting = response.data;

      return {
        id: meeting.id,
        meetingId: meeting.id,
        joinUrl: meeting.join_url,
        startTime: meeting.start_time,
        endTime: new Date(new Date(meeting.start_time).getTime() + meeting.duration * 60000).toISOString(),
        attendees,
        topic: meeting.topic,
        agenda: meeting.agenda,
        password: meeting.encrypted_password
      };
    } catch (error) {
      logger.error('Zoom create meeting error:', error.response?.data || error.message);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  // Update a Zoom meeting
  async updateZoomMeeting(meetingId, {
    summary,
    description,
    startTime,
    endTime,
    attendees = null
  }) {
    try {
      if (!this.accountId || !this.clientId || !this.clientSecret) {
        throw new Error('Zoom credentials not configured');
      }

      const updateData = {};

      if (summary) updateData.topic = summary;
      if (description) updateData.agenda = description;
      if (startTime) updateData.start_time = startTime.toISOString();
      if (endTime && startTime) {
        updateData.duration = Math.ceil((endTime - startTime) / 60000);
      }

      const response = await axios.patch(
        `${this.baseUrl}/meetings/${meetingId}`,
        updateData,
        { headers: this.getHeaders() }
      );

      const meeting = response.data;

      return {
        id: meeting.id,
        meetingId: meeting.id,
        joinUrl: meeting.join_url,
        startTime: meeting.start_time,
        endTime: new Date(new Date(meeting.start_time).getTime() + meeting.duration * 60000).toISOString(),
        attendees: attendees || [],
        topic: meeting.topic,
        agenda: meeting.agenda
      };
    } catch (error) {
      logger.error('Zoom update meeting error:', error.response?.data || error.message);
      throw new Error('Failed to update Zoom meeting');
    }
  }

  // Delete a Zoom meeting
  async deleteZoomMeeting(meetingId) {
    try {
      if (!this.accountId || !this.clientId || !this.clientSecret) {
        throw new Error('Zoom credentials not configured');
      }

      await axios.delete(
        `${this.baseUrl}/meetings/${meetingId}`,
        { headers: this.getHeaders() }
      );

      return { success: true, message: 'Meeting deleted successfully' };
    } catch (error) {
      logger.error('Zoom delete meeting error:', error.response?.data || error.message);
      throw new Error('Failed to delete Zoom meeting');
    }
  }

  // Get meeting details
  async getZoomMeeting(meetingId) {
    try {
      if (!this.accountId || !this.clientId || !this.clientSecret) {
        throw new Error('Zoom credentials not configured');
      }

      const response = await axios.get(
        `${this.baseUrl}/meetings/${meetingId}`,
        { headers: this.getHeaders() }
      );

      const meeting = response.data;

      return {
        id: meeting.id,
        meetingId: meeting.id,
        joinUrl: meeting.join_url,
        startTime: meeting.start_time,
        endTime: new Date(new Date(meeting.start_time).getTime() + meeting.duration * 60000).toISOString(),
        attendees: [],
        topic: meeting.topic,
        agenda: meeting.agenda,
        status: meeting.status,
        created: meeting.created_at,
        updated: meeting.updated_at
      };
    } catch (error) {
      logger.error('Zoom get meeting error:', error.response?.data || error.message);
      throw new Error('Failed to get Zoom meeting');
    }
  }

  // List upcoming meetings
  async listUpcomingMeetings(maxResults = 10) {
    try {
      if (!this.accountId || !this.clientId || !this.clientSecret) {
        throw new Error('Zoom credentials not configured');
      }

      const response = await axios.get(
        `${this.baseUrl}/users/me/meetings?type=upcoming&page_size=${maxResults}`,
        { headers: this.getHeaders() }
      );

      return response.data.meetings.map(meeting => ({
        id: meeting.id,
        meetingId: meeting.id,
        joinUrl: meeting.join_url,
        startTime: meeting.start_time,
        endTime: new Date(new Date(meeting.start_time).getTime() + meeting.duration * 60000).toISOString(),
        attendees: [],
        topic: meeting.topic,
        agenda: meeting.agenda
      }));
    } catch (error) {
      logger.error('Zoom list meetings error:', error.response?.data || error.message);
      return [];
    }
  }

  // Generate meeting link without creating calendar event
  async generateMeetingLink() {
    try {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

      const meeting = await this.createZoomMeeting({
        summary: 'Temporary Meeting Link',
        description: 'Auto-generated meeting link',
        startTime,
        endTime,
        attendees: []
      });

      return meeting.joinUrl;
    } catch (error) {
      logger.error('Zoom generate link error:', error.message);
      throw new Error('Failed to generate Zoom meeting link');
    }
  }

  // Check if user has access to meeting
  async checkMeetingAccess(meetingId, userEmail) {
    try {
      // For Zoom, anyone with the meeting link can join
      // This is a simplified check - you might want to implement stricter access control
      const meeting = await this.getZoomMeeting(meetingId);
      return !!meeting;
    } catch (error) {
      logger.error('Zoom check access error:', error.message);
      return false;
    }
  }

  // Get meeting statistics
  async getMeetingStats(meetingId) {
    try {
      if (!this.accountId || !this.clientId || !this.clientSecret) {
        throw new Error('Zoom credentials not configured');
      }

      const response = await axios.get(
        `${this.baseUrl}/meetings/${meetingId}`,
        { headers: this.getHeaders() }
      );

      const meeting = response.data;
      const startTime = new Date(meeting.start_time);
      const endTime = new Date(startTime.getTime() + meeting.duration * 60000);

      return {
        meetingId,
        startTime: meeting.start_time,
        endTime: endTime.toISOString(),
        status: meeting.status,
        duration: meeting.duration,
        timezone: meeting.timezone,
        topic: meeting.topic
      };
    } catch (error) {
      logger.error('Zoom get stats error:', error.message);
      return null;
    }
  }

  // Add registrant to meeting
  async addRegistrant(meetingId, registrantData) {
    try {
      if (!this.accountId || !this.clientId || !this.clientSecret) {
        throw new Error('Zoom credentials not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/meetings/${meetingId}/registrants`,
        {
          first_name: registrantData.firstName || '',
          last_name: registrantData.lastName || '',
          email: registrantData.email,
          action: 'create'
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      logger.error('Zoom add registrant error:', error.response?.data || error.message);
      throw new Error('Failed to add registrant to Zoom meeting');
    }
  }
}

// Export singleton instance
const zoomService = new ZoomService();

// Export individual functions for easier testing
const createZoomMeeting = (params) => zoomService.createZoomMeeting(params);
const updateZoomMeeting = (meetingId, params) => zoomService.updateZoomMeeting(meetingId, params);
const deleteZoomMeeting = (meetingId) => zoomService.deleteZoomMeeting(meetingId);
const getZoomMeeting = (meetingId) => zoomService.getZoomMeeting(meetingId);
const generateMeetingLink = () => zoomService.generateMeetingLink();

module.exports = {
  zoomService,
  createZoomMeeting,
  updateZoomMeeting,
  deleteZoomMeeting,
  getZoomMeeting,
  generateMeetingLink
};
