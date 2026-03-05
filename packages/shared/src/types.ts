export type UserRole = 'citizen' | 'builder' | 'admin' | 'gov_agent';

export type IssueType =
  | 'pothole'
  | 'crack'
  | 'flooding'
  | 'shoulder_damage'
  | 'lane_markings_missing'
  | 'crossings'
  | 'road_signage'
  | 'speed_limits'
  | 'margins_shoulders'
  | 'sidewalks'
  | 'drainage'
  | 'street_lighting'
  | 'traffic_lighting'
  | 'bad_attempted_repair'
  | 'other';

export type Severity = 'minor' | 'moderate' | 'severe';

export type IssueStatus =
  | 'reported'
  | 'under_review'
  | 'complaint_filed'
  | 'assigned'
  | 'claimed'
  | 'in_progress'
  | 'fixed_pending'
  | 'verified'
  | 'closed';

export type ClaimStatus =
  | 'claimed'
  | 'in_progress'
  | 'fix_submitted'
  | 'verified'
  | 'rejected'
  | 'cancelled';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RoadSegmentDto {
  id: string;
  osmWayId: number;
  osmRoadName: string | null;
  qualityScore: number;
  lengthM: number | null;
  ghmcZone: string | null;
}

export interface IssueDto {
  id: string;
  roadSegmentId: string;
  issueType: IssueType;
  severity: Severity;
  qualityScore: number;
  status: IssueStatus;
  firstReportedAt: string;
  lastUpdatedAt: string;
}

export interface IssueReportDto {
  id: string;
  issueId: string | null;
  roadSegmentId: string;
  issueType: IssueType;
  severity: Severity;
  photoUrl: string;
  location: GeoPoint;
  exifTimestamp: string | null;
  reportedAt: string;
}
