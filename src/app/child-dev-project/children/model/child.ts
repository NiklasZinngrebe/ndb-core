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

import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { ConfigurableEnumValue } from "../../../core/configurable-enum/configurable-enum.interface";
import { calculateAge } from "../../../utils/utils";
import { Photo } from "../child-photo-service/photo";

export type Center = ConfigurableEnumValue;
@DatabaseEntity("Child")
export class Child extends Entity {
  static create(name: string): Child {
    const instance = new Child();
    instance.name = name;
    return instance;
  }

  static getBlockComponent(): string {
    return "ChildBlock";
  }

  @DatabaseField({
    label: $localize`:Label for the name of a child:Name`,
    required: true,
  })
  name: string;
  @DatabaseField({
    label: $localize`:Label for the project number of a child:Project Number`,
    labelShort: $localize`:Short label for the project number:PN`,
  })
  projectNumber: string;
  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the date of birth of a child:Date of birth`,
    labelShort: $localize`:Short label for the date of birth:DoB`,
    editComponent: "EditAge",
  })
  dateOfBirth: Date;

  @DatabaseField({
    dataType: "configurable-enum",
    label: $localize`:Label for the gender of a child:Gender`,
    innerDataType: "genders",
  })
  gender: ConfigurableEnumValue;

  @DatabaseField({
    dataType: "configurable-enum",
    innerDataType: "center",
    label: $localize`:Label for the center of a child:Center`,
  })
  center: Center;
  @DatabaseField({
    label: $localize`:Label for the admission date of a child:Admission`,
  })
  admissionDate: Date;
  @DatabaseField({
    label: $localize`:Label for the status of a child:Status`,
  })
  status: string = "";

  @DatabaseField({
    label: $localize`:Label for the dropout date of a child:Dropout Date`,
  })
  dropoutDate: Date;
  @DatabaseField({
    label: $localize`:Label for the type of dropout of a child:Dropout Type`,
  })
  dropoutType: string;
  @DatabaseField({
    label: $localize`:Label for the remarks about a dropout of a child:Dropout remarks`,
  })
  dropoutRemarks: string;

  /** current school (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolId: string = "";
  /** current class (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolClass: string = "";

  @DatabaseField({
    dataType: "photo",
    defaultValue: "",
    label: $localize`:Label for the filename of a photo of a child:Photo Filename`,
  })
  photo: Photo;

  get age(): number {
    return this.dateOfBirth ? calculateAge(this.dateOfBirth) : null;
  }

  get isActive(): boolean {
    return (
      this.status !== "Dropout" && !this["dropoutDate"] && !this["exit_date"]
    );
  }

  /**
   * @override see {@link Entity}
   */
  @DatabaseField() get searchIndices(): string[] {
    let indices = [];

    if (this.name !== undefined) {
      indices = indices.concat(this.name.split(" "));
    }
    if (this.projectNumber !== undefined) {
      indices.push(this.projectNumber);
    }

    return indices;
  }
  set searchIndices(value) {}

  public toString() {
    return this.name;
  }
}
