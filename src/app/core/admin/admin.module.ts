import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminComponent } from "./admin/admin.component";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { BrowserModule } from "@angular/platform-browser";
import { AlertsModule } from "../alerts/alerts.module";
import { EntityModule } from "../entity/entity.module";
import { HttpClientModule } from "@angular/common/http";
import { ChildPhotoUpdateService } from "./services/child-photo-update.service";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTableModule } from "@angular/material/table";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { UserListComponent } from "./user-list/user-list.component";
import { BackupService } from "./services/backup.service";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * GUI for administrative users to manage and maintain background and technical aspects of the app.
 */
@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTableModule,
    MatCheckboxModule,
    AlertsModule,
    EntityModule,
    HttpClientModule,
    FormsModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
  ],
  declarations: [AdminComponent, UserListComponent],
  providers: [ChildPhotoUpdateService, BackupService],
})
export class AdminModule {}
