import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

const ISSUE_TYPES = [
  'pothole',
  'crack',
  'flooding',
  'shoulder_damage',
  'lane_markings_missing',
  'crossings',
  'road_signage',
  'speed_limits',
  'margins_shoulders',
  'sidewalks',
  'drainage',
  'street_lighting',
  'traffic_lighting',
  'bad_attempted_repair',
  'other',
] as const;
const SEVERITIES = ['minor', 'moderate', 'severe'] as const;

export class CreateReportDto {
  @IsString()
  @IsIn(ISSUE_TYPES)
  issueType: (typeof ISSUE_TYPES)[number];

  @IsString()
  @IsIn(SEVERITIES)
  severity: (typeof SEVERITIES)[number];

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsString()
  photoUrl: string;

  @IsString()
  photoHash: string;

  @IsOptional()
  @IsString()
  exifTimestamp?: string;
}
