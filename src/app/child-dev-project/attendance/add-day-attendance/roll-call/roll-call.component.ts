import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { animate, style, transition, trigger } from "@angular/animations";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
} from "../../model/attendance-status";
import { Note } from "../../../notes/model/note";
import { EventAttendance } from "../../model/event-attendance";
import { ConfigService } from "../../../../core/config/config.service";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
} from "../../../../core/configurable-enum/configurable-enum.interface";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../../children/model/child";
import { LoggingService } from "../../../../core/logging/logging.service";
import { FormGroup } from "@angular/forms";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";

/**
 * Displays the participants of the given event one by one to mark attendance status.
 */
@Component({
  selector: "app-roll-call",
  templateUrl: "./roll-call.component.html",
  styleUrls: ["./roll-call.component.scss"],
  animations: [
    trigger("completeRollCall", [
      transition("void => *", [
        style({ backgroundColor: "white" }),
        animate(1000),
      ]),
    ]),
  ],
})
export class RollCallComponent implements OnInit {
  /**
   * The event to be displayed and edited.
   */
  @Input() eventEntity: Note;

  /**
   * Emitted when the roll call is finished and results can be saved.
   */
  @Output() complete = new EventEmitter<Note>();

  /**
   * Emitted when the user wants to dismiss & leave the roll call view.
   */
  @Output() exit = new EventEmitter();

  currentIndex: number;

  /** options available for selecting an attendance status */
  availableStatus: AttendanceStatusType[];

  entries: { child: Child; attendance: EventAttendance }[];
  form: FormGroup;

  constructor(
    private configService: ConfigService,
    private entityMapper: EntityMapperService,
    private loggingService: LoggingService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  async ngOnInit() {
    this.loadAttendanceStatusTypes();
    await this.loadParticipants();
  }

  private loadAttendanceStatusTypes() {
    this.availableStatus = this.configService.getConfig<
      ConfigurableEnumConfig<AttendanceStatusType>
    >(CONFIGURABLE_ENUM_CONFIG_PREFIX + ATTENDANCE_STATUS_CONFIG_ID);
  }

  private async loadParticipants() {
    this.entries = [];
    this.currentIndex = 0;
    for (const childId of this.eventEntity.children) {
      let child;
      try {
        child = await this.entityMapper.load(Child, childId);
      } catch (e) {
        this.loggingService.warn(
          "Could not find child " +
            childId +
            " for event " +
            this.eventEntity.getId()
        );
        continue;
      }
      this.entries.push({
        child: child,
        attendance: this.eventEntity.getAttendance(childId),
      });
    }
  }

  markAttendance(attendance: EventAttendance, status: AttendanceStatusType) {
    attendance.status = status;

    // automatically move to next participant after a short delay giving the user visual feedback on the selected status
    setTimeout(() => this.goToNextParticipant(), 750);
  }

  goToNextParticipant(newIndex?: number) {
    if (newIndex !== undefined) {
      this.currentIndex = newIndex;
    } else {
      this.currentIndex++;
    }

    if (this.isFinished()) {
      this.complete.emit(this.eventEntity);
    }
  }

  isFinished(): boolean {
    return this.currentIndex >= this.entries?.length;
  }

  save() {
    if (this.isFinished()) {
      this.goToNextParticipant(this.entries?.length);
    } else {
      const remainingParticipant = this.entries.length - this.currentIndex;
      const dialogRef = this.confirmationDialog.openDialog(
        $localize`:Save & Next confirmation title: Save & Exit`,
        $localize`:Save & Exit confirmation text:Are you sure you want to save, exit and skip the remaining ${remainingParticipant.toString()} participants?`
      );

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.goToNextParticipant(this.entries?.length);
        }
      });
    }
  }

  abort() {
    if (this.isFinished()) {
      this.exit.emit();
    } else {
      const dialogRef = this.confirmationDialog.openDialog(
        $localize`:Abort confirmation title: Abort`,
        $localize`:Abort confirmation text:Are you sure you want to exit and discard all recordings?`
      );

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.exit.emit();
        }
      });
    }
  }
}
