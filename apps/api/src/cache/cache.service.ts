import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const PHOTO_HASH_KEY_PREFIX = 'fixmyroad:photo_hash:';
const PHOTO_HASH_TTL_DAYS = 90;
const MAP_GEOJSON_PREFIX = 'fixmyroad:map:v2:';
const MAP_GEOJSON_TTL_SEC = 300;

@Injectable()
export class CacheService implements OnModuleDestroy {
  private client: Redis | null = null;

  constructor() {
    const url = process.env.REDIS_URL;
    if (url) {
      this.client = new Redis(url, { maxRetriesPerRequest: 2 });
      this.client.on('error', () => {});
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  get isAvailable(): boolean {
    return this.client != null;
  }

  async isPhotoHashSeen(hash: string): Promise<boolean> {
    if (!this.client) return false;
    const key = PHOTO_HASH_KEY_PREFIX + hash;
    const v = await this.client.get(key);
    return v === '1';
  }

  async setPhotoHashSeen(hash: string): Promise<void> {
    if (!this.client) return;
    const key = PHOTO_HASH_KEY_PREFIX + hash;
    await this.client.set(key, '1', 'EX', PHOTO_HASH_TTL_DAYS * 86400);
  }

  async getMapGeoJson(bbox: string): Promise<object | null> {
    if (!this.client) return null;
    const key = MAP_GEOJSON_PREFIX + bbox;
    const raw = await this.client.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  async setMapGeoJson(bbox: string, geojson: object): Promise<void> {
    if (!this.client) return;
    const key = MAP_GEOJSON_PREFIX + bbox;
    await this.client.set(key, JSON.stringify(geojson), 'EX', MAP_GEOJSON_TTL_SEC);
  }
}
