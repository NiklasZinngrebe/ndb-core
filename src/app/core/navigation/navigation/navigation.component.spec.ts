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

import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { NavigationComponent } from "./navigation.component";
import { RouterTestingModule } from "@angular/router/testing";
import { MenuItem } from "../menu-item";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { ConfigService } from "../../config/config.service";
import { BehaviorSubject } from "rxjs";
import { Config } from "../../config/config";
import { UserRoleGuard } from "../../permissions/user-role.guard";
import { ActivatedRouteSnapshot } from "@angular/router";

describe("NavigationComponent", () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockConfigUpdated: BehaviorSubject<Config>;
  let mockUserRoleGuard: jasmine.SpyObj<UserRoleGuard>;

  beforeEach(
    waitForAsync(() => {
      mockConfigUpdated = new BehaviorSubject<Config>(null);
      mockConfigService = jasmine.createSpyObj(["getConfig"]);
      mockConfigService.getConfig.and.returnValue({ items: [] });
      mockConfigService.configUpdates = mockConfigUpdated;
      mockUserRoleGuard = jasmine.createSpyObj(["canActivate"]);
      mockUserRoleGuard.canActivate.and.returnValue(true);

      TestBed.configureTestingModule({
        imports: [
          RouterTestingModule,
          MatIconModule,
          MatDividerModule,
          MatListModule,
        ],
        declarations: [NavigationComponent],
        providers: [
          { provide: UserRoleGuard, useValue: mockUserRoleGuard },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("generates menu items from config", function () {
    const testConfig = {
      items: [
        { name: "Dashboard", icon: "home", link: "/dashboard" },
        { name: "Children", icon: "child", link: "/child" },
      ],
    };
    mockConfigService.getConfig.and.returnValues(
      testConfig,
      undefined,
      undefined
    );
    mockConfigUpdated.next(null);
    const items = component.menuItems;

    expect(items).toEqual([
      new MenuItem("Dashboard", "home", "/dashboard"),
      new MenuItem("Children", "child", "/child"),
    ]);
  });

  it("marks items that require admin rights", function () {
    const testConfig = {
      items: [
        { name: "Dashboard", icon: "home", link: "/dashboard" },
        { name: "Children", icon: "child", link: "/child" },
      ],
    };
    mockConfigService.getConfig.and.returnValues(
      testConfig,
      { permittedUserRoles: ["admin"] },
      undefined
    );
    mockUserRoleGuard.canActivate.and.callFake(
      (route: ActivatedRouteSnapshot) => {
        switch (route.routeConfig.path) {
          case "dashboard":
            return false;
          case "child":
            return true;
          default:
            return false;
        }
      }
    );

    mockConfigUpdated.next(null);

    expect(mockUserRoleGuard.canActivate).toHaveBeenCalledWith({
      routeConfig: { path: "dashboard" },
      data: { permittedUserRoles: ["admin"] },
    } as any);
    expect(mockUserRoleGuard.canActivate).toHaveBeenCalledWith({
      routeConfig: { path: "child" },
      data: { permittedUserRoles: undefined },
    } as any);
    expect(component.menuItems).toEqual([
      new MenuItem("Children", "child", "/child"),
    ]);
  });
});
