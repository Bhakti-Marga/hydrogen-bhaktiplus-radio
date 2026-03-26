import { ApiConfig } from "./types";
import { SatsangsService } from "./services/satsangs";
import { LivesService } from "./services/lives";
import { LiveStatusService } from "./services/live-status";
import { SearchService } from "./services/search";
import { PilgrimagesService } from "./services/pilgrimages";
import { UserService } from "./services/user";
import { CommentariesService } from "./services/commentaries";
import { TalksService } from "./services/talks";
import { LocaleService } from "./services/locale";
import { VideoService } from "./services/video";
import { MembershipsService } from "./services/memberships";
import { MetaService } from "./services/meta";

export class BhaktiMargMediaApi {
  public readonly satsangs: SatsangsService;
  public readonly lives: LivesService;
  public readonly liveStatus: LiveStatusService;
  public readonly search: SearchService;
  public readonly pilgrimages: PilgrimagesService;
  public readonly user: UserService;
  public readonly commentaries: CommentariesService;
  public readonly talks: TalksService;
  public readonly locale: LocaleService;
  public readonly video: VideoService;
  public readonly memberships: MembershipsService;
  public readonly meta: MetaService;

  constructor(config: ApiConfig) {
    this.satsangs = new SatsangsService(config);
    this.lives = new LivesService(config);
    this.liveStatus = new LiveStatusService(config);
    this.search = new SearchService(config);
    this.pilgrimages = new PilgrimagesService(config);
    this.user = new UserService(config);
    this.commentaries = new CommentariesService(config);
    this.talks = new TalksService(config);
    this.locale = new LocaleService(config);
    this.video = new VideoService(config);
    this.memberships = new MembershipsService(config);
    this.meta = new MetaService(config);
  }
}

// Export all types
export * from "./types";
