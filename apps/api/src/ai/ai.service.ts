import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppException } from '../common/errors/app.exception.js';
import { SettingsService } from '../settings/settings.service.js';
import { OpenAiCompatibleProvider } from './openai-compatible.js';
import { endpointHost, loadProfiles, profileKey } from './profiles.js';
import type { AiProfile, ChatProvider } from './types.js';

export interface ProfileTestResult {
  ok: boolean;
  latencyMs: number;
  model: string;
  error?: string;
}

@Injectable()
export class AiService {
  private readonly profiles: AiProfile[] = loadProfiles();

  constructor(@Inject(SettingsService) private readonly settings: SettingsService) {}

  list(activeName: string) {
    return this.profiles.map((profile) => ({
      name: profile.name,
      label: profile.label,
      kind: profile.kind,
      model: profile.model,
      endpoint: endpointHost(profile.baseUrl),
      active: profile.name === activeName,
    }));
  }

  find(name: string): AiProfile {
    const profile = this.profiles.find((p) => p.name === name);
    if (!profile) {
      throw new AppException(HttpStatus.NOT_FOUND, {
        code: 'not_found',
        message: `No AI profile is named "${name}".`,
      });
    }
    return profile;
  }

  /** The active profile and a provider for it. */
  async active(): Promise<{ profile: AiProfile; provider: ChatProvider }> {
    const { ai } = await this.settings.get();
    const profile = this.profiles.find((p) => p.name === ai.activeProfile);
    if (!profile) throw new Error(`The active AI profile "${ai.activeProfile}" is not configured.`);
    return { profile, provider: this.providerFor(profile) };
  }

  providerFor(profile: AiProfile): ChatProvider {
    return new OpenAiCompatibleProvider(profile, { apiKey: profileKey(profile.name) });
  }

  async test(name: string): Promise<ProfileTestResult> {
    const profile = this.find(name);
    const provider = new OpenAiCompatibleProvider(profile, {
      apiKey: profileKey(profile.name),
      maxRetries: 0,
    });
    const started = performance.now();
    try {
      const res = await provider.chat({
        messages: [{ role: 'user', content: 'Reply with OK.' }],
        maxTokens: 1,
        temperature: 0,
      });
      return {
        ok: true,
        latencyMs: Math.round(performance.now() - started),
        model: res.rawModel ?? profile.model,
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - started),
        model: profile.model,
        error: (error as Error).message,
      };
    }
  }
}
