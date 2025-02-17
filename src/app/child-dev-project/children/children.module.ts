/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { NgModule } from "@angular/core";
import { CommonModule, DatePipe, PercentPipe } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatExpansionModule } from "@angular/material/expansion";
import { ChildrenListComponent } from "./children-list/children-list.component";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FlexLayoutModule } from "@angular/flex-layout";
import { ChildrenService } from "./children.service";
import { ChildrenCountDashboardComponent } from "./children-count-dashboard/children-count-dashboard.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { NotesOfChildComponent } from "../notes/notes-of-child/notes-of-child.component";
import { SchoolsModule } from "../schools/schools.module";
import { EducationalMaterialComponent } from "../educational-material/educational-material-component/educational-material.component";
import { AserComponent } from "../aser/aser-component/aser.component";
import { FilterPipeModule } from "ngx-filter-pipe";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NoRecentNotesDashboardComponent } from "../notes/dashboard-widgets/no-recent-notes-dashboard/no-recent-notes-dashboard.component";
import { HealthCheckupComponent } from "../health-checkup/health-checkup-component/health-checkup.component";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { PreviousSchoolsComponent } from "../previous-schools/previous-schools.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RecentNotesDashboardComponent } from "../notes/dashboard-widgets/recent-notes-dashboard/recent-notes-dashboard.component";
import { FormDialogModule } from "../../core/form-dialog/form-dialog.module";
import { ConfirmationDialogModule } from "../../core/confirmation-dialog/confirmation-dialog.module";
import { MatPaginatorModule } from "@angular/material/paginator";
import { Angulartics2Module } from "angulartics2";
import { ViewModule } from "../../core/view/view.module";
import { ChildBlockComponent } from "./child-block/child-block.component";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { EntityListModule } from "../../core/entity-components/entity-list/entity-list.module";
import { WebdavModule } from "../../core/webdav/webdav.module";
import { BmiBlockComponent } from "./children-list/bmi-block/bmi-block.component";
import { ChildrenBmiDashboardComponent } from "./children-bmi-dashboard/children-bmi-dashboard.component";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { PhotoDatatype } from "./child-photo-service/datatype-photo";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSidenavModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatTooltipModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FilterPipeModule,
    SchoolsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatListModule,
    WebdavModule,
    MatProgressSpinnerModule,
    ConfirmationDialogModule,
    FormDialogModule,
    Angulartics2Module,
    ViewModule,
    EntitySubrecordModule,
    EntityListModule,
    EntityUtilsModule,
  ],
  declarations: [
    ChildBlockComponent,
    NotesOfChildComponent,
    ChildrenListComponent,
    ChildrenCountDashboardComponent,
    EducationalMaterialComponent,
    AserComponent,
    NoRecentNotesDashboardComponent,
    RecentNotesDashboardComponent,
    HealthCheckupComponent,
    PreviousSchoolsComponent,
    BmiBlockComponent,
    ChildrenBmiDashboardComponent,
  ],
  providers: [ChildrenService, DatePipe, PercentPipe],
  exports: [
    ChildBlockComponent,
    ChildrenCountDashboardComponent,
    NoRecentNotesDashboardComponent,
    RecentNotesDashboardComponent,
    BmiBlockComponent,
  ],
  entryComponents: [ChildBlockComponent],
})
export class ChildrenModule {
  constructor(entitySchemaService: EntitySchemaService) {
    entitySchemaService.registerSchemaDatatype(new PhotoDatatype());
  }
}
