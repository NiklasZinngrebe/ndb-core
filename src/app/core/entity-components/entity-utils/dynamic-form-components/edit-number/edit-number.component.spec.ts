import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditNumberComponent } from "./edit-number.component";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EditNumberComponent", () => {
  let component: EditNumberComponent;
  let fixture: ComponentFixture<EditNumberComponent>;
  let formGroup: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      declarations: [EditNumberComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditNumberComponent);
    component = fixture.componentInstance;
    const formControl = new FormControl();
    formGroup = new FormGroup({ testProperty: formControl });
    component.onInitFromDynamicConfig({
      formControl: formControl,
      propertySchema: {},
      formFieldConfig: { id: "testProperty" },
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only allow valid numbers", () => {
    component.formControl.setValue("one" as any);
    expect(formGroup.invalid).toBeTrue();

    component.formControl.setValue("1" as any);
    expect(formGroup.valid).toBeTrue();
  });

  it("should allow decimal numbers", () => {
    component.formControl.setValue(1.1);
    expect(formGroup.valid).toBeTrue();
  });
});
