import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { DatePipe } from "@angular/common";
import { EducationalMaterial } from "../model/educational-material";
import { ChildrenService } from "../../children/children.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";

@UntilDestroy()
@Component({
  selector: "app-educational-material",
  templateUrl: "./educational-material.component.html",
})
export class EducationalMaterialComponent
  implements OnChanges, OnInitDynamicComponent {
  @Input() child: Child;
  records = new Array<EducationalMaterial>();

  materialTypes = EducationalMaterial.MATERIAL_ALL;

  columns: Array<ColumnDescription> = [
    {
      name: "date",
      label: "Date",
      inputType: ColumnDescriptionInputType.DATE,
      formatter: (v: Date) => this.datePipe.transform(v, "yyyy-MM-dd"),
      visibleFrom: "xs",
    },
    {
      name: "materialType",
      label: "Material",
      inputType: ColumnDescriptionInputType.AUTOCOMPLETE,
      selectValues: this.materialTypes.map((t) => {
        return { value: t, label: t };
      }),
      visibleFrom: "xs",
    },
    {
      name: "materialAmount",
      label: "Amount",
      inputType: ColumnDescriptionInputType.NUMBER,
      visibleFrom: "md",
    },
    {
      name: "description",
      label: "Description/Remarks",
      inputType: ColumnDescriptionInputType.TEXT,
      visibleFrom: "md",
    },
  ];

  constructor(
    private childrenService: ChildrenService,
    private datePipe: DatePipe
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("child")) {
      this.loadData(this.child.getId());
    }
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    this.child = config.entity as Child;
    this.loadData(this.child.getId());
  }

  loadData(id: string) {
    this.childrenService
      .getEducationalMaterialsOfChild(id)
      .pipe(untilDestroyed(this))
      .subscribe((results) => {
        this.records = results.sort(
          (a, b) =>
            (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
        );
      });
  }

  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const child = this.child.getId();

    return () => {
      const newAtt = new EducationalMaterial(Date.now().toString());

      // use last entered date as default, otherwise today's date
      newAtt.date = this.records.length > 0 ? this.records[0].date : new Date();
      newAtt.child = child;

      return newAtt;
    };
  }

  getSummary() {
    if (this.records.length === 0) {
      return "";
    }

    const summary = new Map<string, number>();
    this.records.forEach((m) => {
      const previousValue = summary.has(m.materialType)
        ? summary.get(m.materialType)
        : 0;
      summary.set(m.materialType, previousValue + m.materialAmount);
    });

    let summaryText = "";
    summary.forEach(
      (v, k) => (summaryText = summaryText + k + ": " + v + ", ")
    );
    return summaryText;
  }
}
