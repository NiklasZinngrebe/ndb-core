import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { AttendanceService } from "../../attendance.service";
import { Note } from "../../../notes/model/note";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { SessionService } from "../../../../core/session/session-service/session.service";
import { NoteDetailsComponent } from "../../../notes/note-details/note-details.component";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { FilterComponentSettings } from "../../../../core/entity-components/entity-list/filter-component.settings";
import { FilterGeneratorService } from "../../../../core/entity-components/entity-list/filter-generator.service";

@Component({
  selector: "app-roll-call-setup",
  templateUrl: "./roll-call-setup.component.html",
  styleUrls: ["./roll-call-setup.component.scss"],
})
export class RollCallSetupComponent implements OnInit {
  date = new Date();

  existingEvents: NoteForActivitySetup[] = [];
  filteredExistingEvents: NoteForActivitySetup[] = [];

  selectedEvent: NoteForActivitySetup;
  @Output() eventSelected = new EventEmitter<Note>();

  allActivities: RecurringActivity[] = [];
  visibleActivities: RecurringActivity[] = [];
  filterSettings: FilterComponentSettings<Note>[] = [];

  /**
   * filters are displayed in the UI only if at least this many events are listed.
   *
   * This avoids displaying irrelevant filters for an empty or very short list.
   */
  readonly FILTER_VISIBLE_THRESHOLD = 4;

  constructor(
    private entityMapper: EntityMapperService,
    private attendanceService: AttendanceService,
    private sessionService: SessionService,
    private formDialog: FormDialogService,
    private filterGenerator: FilterGeneratorService
  ) {}

  async ngOnInit() {
    await this.initAvailableEvents();
  }

  private async initAvailableEvents() {
    this.existingEvents = await this.attendanceService.getEventsOnDate(
      this.date
    );
    await this.loadActivities();
    await this.updateEventsList();
  }

  private async loadActivities() {
    this.allActivities = await this.entityMapper.loadType<RecurringActivity>(
      RecurringActivity
    );

    this.visibleActivities = this.allActivities.filter((a) =>
      a.assignedTo.includes(this.sessionService.getCurrentUser().name)
    );
    if (this.visibleActivities.length === 0) {
      this.visibleActivities = this.allActivities.filter(
        (a) => a.assignedTo.length === 0
      );
    }

    for (const activity of this.visibleActivities) {
      const newEvent = await this.createEventForActivity(activity);
      if (newEvent) {
        this.existingEvents.push(newEvent);
      }
    }
  }

  async showMore() {
    const additionalActivities = this.allActivities.filter(
      (a) => !this.visibleActivities.includes(a)
    );
    for (const activity of additionalActivities) {
      const newEvent = await this.createEventForActivity(activity);
      if (newEvent) {
        this.existingEvents.push(newEvent);
      }
      this.visibleActivities.push(activity);
    }
    await this.updateEventsList();
  }

  async setNewDate(date: Date) {
    this.date = date;

    await this.initAvailableEvents();

    if (!RecurringActivity.isActivityEventNote(this.selectedEvent)) {
      this.selectedEvent = null;
    }
  }

  private async createEventForActivity(
    activity: RecurringActivity
  ): Promise<NoteForActivitySetup> {
    if (this.existingEvents.find((e) => e.relatesTo === activity._id)) {
      return undefined;
    }

    const event = (await this.attendanceService.createEventForActivity(
      activity,
      this.date
    )) as NoteForActivitySetup;
    event.authors = [this.sessionService.getCurrentUser().name];
    event.isNewFromActivity = true;
    return event;
  }

  private sortEvents() {
    const calculateEventPriority = (event: Note) => {
      let score = 0;

      const activityAssignedUsers = this.allActivities.find(
        (a) => a._id === event.relatesTo
      )?.assignedTo;
      // use parent activities' assigned users and only fall back to event if necessary
      const assignedUsers = activityAssignedUsers ?? event.authors;

      if (!RecurringActivity.isActivityEventNote(event)) {
        // show one-time events first
        score += 1;
      }

      if (assignedUsers.includes(this.sessionService.getCurrentUser().name)) {
        score += 2;
      }

      return score;
    };

    this.existingEvents = this.existingEvents.sort(
      (a, b) => calculateEventPriority(b) - calculateEventPriority(a)
    );
  }

  createOneTimeEvent() {
    const newNote = Note.create(new Date());
    newNote.authors = [this.sessionService.getCurrentUser().name];

    this.formDialog
      .openDialog(NoteDetailsComponent, newNote)
      .afterClosed()
      .subscribe((createdNote: Note) => {
        if (createdNote) {
          this.existingEvents.push(createdNote);
          this.selectedEvent = createdNote;
        }
      });
  }

  private async updateEventsList() {
    await this.updateFilterOptions();
    this.filterExistingEvents();
    this.sortEvents();
  }

  private async updateFilterOptions() {
    this.filterSettings = await this.filterGenerator.generate(
      [{ id: "category" }, { id: "schools" }],
      Note,
      this.existingEvents,
      true
    );
  }

  private filterExistingEvents() {
    let filteredEvents = this.existingEvents;
    for (const filter of this.filterSettings) {
      const filterFun = filter.filterSettings.getFilterFunction(
        filter.selectedOption
      );
      filteredEvents = filteredEvents.filter(filterFun);
    }

    this.filteredExistingEvents = filteredEvents;
  }

  applyFilter(
    selectedFilter: FilterComponentSettings<Note>,
    optionKey: string
  ) {
    selectedFilter.selectedOption = optionKey;
    this.filterExistingEvents();
  }
}

type NoteForActivitySetup = Note & { isNewFromActivity?: boolean };
