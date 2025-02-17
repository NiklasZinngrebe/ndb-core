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

import { SyncedSessionService } from "./synced-session.service";
import { AlertService } from "../../alerts/alert.service";
import { LoginState } from "../session-states/login-state.enum";
import { AppConfig } from "../../app-config/app-config";
import { LocalSession } from "./local-session";
import { RemoteSession } from "./remote-session";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { SessionType } from "../session-type";
import { fakeAsync, flush, TestBed, tick } from "@angular/core/testing";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { LoggingService } from "../../logging/logging.service";
import { of, throwError } from "rxjs";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DatabaseUser } from "./local-user";
import { TEST_PASSWORD, TEST_USER } from "../mock-session.module";
import { testSessionServiceImplementation } from "./session.service.spec";

describe("SyncedSessionService", () => {
  let sessionService: SyncedSessionService;
  let localSession: LocalSession;
  let remoteSession: RemoteSession;
  let localLoginSpy: jasmine.Spy<
    (username: string, password: string) => Promise<LoginState>
  >;
  let remoteLoginSpy: jasmine.Spy<
    (username: string, password: string) => Promise<LoginState>
  >;
  let dbUser: DatabaseUser;
  let syncSpy: jasmine.Spy<() => Promise<void>>;
  let liveSyncSpy: jasmine.Spy<() => void>;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj(["post", "delete"]);
    mockHttpClient.delete.and.returnValue(of());
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, NoopAnimationsModule],
      providers: [
        EntitySchemaService,
        AlertService,
        LoggingService,
        SyncedSessionService,
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.mock,
      database: {
        name: "integration_tests",
        remote_url: "https://demo.aam-digital.com/db/",
      },
      webdav: { remote_url: "" },
    };
    sessionService = TestBed.inject(SyncedSessionService);

    // make private members localSession and remoteSession available in the tests
    // @ts-ignore
    localSession = sessionService._localSession;
    // @ts-ignore
    remoteSession = sessionService._remoteSession;

    // Setting up local and remote session to accept TEST_USER and TEST_PASSWORD as valid credentials
    dbUser = { name: TEST_USER, roles: ["user_app"] };
    localSession.saveUser({ name: TEST_USER, roles: [] }, TEST_PASSWORD);
    mockHttpClient.post.and.callFake((url, body) => {
      if (body.name === TEST_USER && body.password === TEST_PASSWORD) {
        return of(dbUser as any);
      } else {
        return throwError(
          new HttpErrorResponse({
            status: remoteSession.UNAUTHORIZED_STATUS_CODE,
          })
        );
      }
    });

    localLoginSpy = spyOn(localSession, "login").and.callThrough();
    remoteLoginSpy = spyOn(remoteSession, "login").and.callThrough();
    syncSpy = spyOn(sessionService, "sync").and.resolveTo();
    liveSyncSpy = spyOn(sessionService, "liveSyncDeferred");
  });

  afterEach(() => {
    localSession.removeUser(TEST_USER);
  });

  it("Remote and local fail (normal login with wrong password)", fakeAsync(() => {
    const result = sessionService.login(TEST_USER, "wrongPassword");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, "wrongPassword");
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, "wrongPassword");
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    flush();
  }));

  it("Remote unavailable, local succeeds (offline)", fakeAsync(() => {
    failRemoteLogin(true);

    const result = sessionService.login(TEST_USER, TEST_PASSWORD);
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);

    sessionService.cancelLoginOfflineRetry();
    flush();
  }));

  it("Remote unavailable, local fails (offline, wrong password)", fakeAsync(() => {
    failRemoteLogin(true);

    const result = sessionService.login(TEST_USER, "wrongPassword");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, "wrongPassword");
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, "wrongPassword");
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    tick();
  }));

  it("Remote succeeds, local fails (password changed and new password entered/new user)", fakeAsync(() => {
    const newUser = { name: "newUser", roles: ["user_app"] };
    passRemoteLogin(newUser);
    spyOn(localSession, "saveUser").and.callThrough();

    const result = sessionService.login(newUser.name, "p");
    tick();

    expect(localLoginSpy.calls.allArgs()).toEqual([
      [newUser.name, "p"],
      [newUser.name, "p"],
    ]);
    expect(remoteLoginSpy.calls.allArgs()).toEqual([[newUser.name, "p"]]);
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(liveSyncSpy).toHaveBeenCalledTimes(1);
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    expect(localSession.saveUser).toHaveBeenCalledWith(
      {
        name: newUser.name,
        roles: newUser.roles,
      },
      "p"
    );
    expect(sessionService.getCurrentUser().name).toBe("newUser");
    expect(sessionService.getCurrentUser().roles).toEqual(["user_app"]);
    tick();
    localSession.removeUser(newUser.name);
  }));

  it("Remote fails, local succeeds (Password changes, old password entered)", fakeAsync(() => {
    failRemoteLogin();
    spyOn(localSession, "removeUser").and.callThrough();

    const result = sessionService.login(TEST_USER, TEST_PASSWORD);
    tick();

    // The local user is removed to prohibit further offline login
    expect(localSession.removeUser).toHaveBeenCalledWith(TEST_USER);
    // Initially the user is logged in
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    // After remote session fails the user is logged out again
    expect(sessionService.loginState.value).toBe(LoginState.LOGIN_FAILED);
    flush();
  }));

  it("Remote and local succeed, sync fails", fakeAsync(() => {
    syncSpy.and.rejectWith();

    const login = sessionService.login(TEST_USER, TEST_PASSWORD);
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(syncSpy).toHaveBeenCalled();
    expect(liveSyncSpy).toHaveBeenCalled();
    expectAsync(login).toBeResolvedTo(LoginState.LOGGED_IN);
    flush();
  }));

  it("Remote succeeds, local fails, sync fails", fakeAsync(() => {
    passRemoteLogin();
    syncSpy.and.rejectWith();

    const result = sessionService.login(TEST_USER, "anotherPassword");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, "anotherPassword");
    expect(localLoginSpy).toHaveBeenCalledTimes(2);
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, "anotherPassword");
    expect(remoteLoginSpy).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalled();
    expect(liveSyncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    tick();
  }));

  it("remote and local unavailable", fakeAsync(() => {
    failRemoteLogin(true);

    const result = sessionService.login("anotherUser", "anotherPassword");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(
      "anotherUser",
      "anotherPassword"
    );
    expect(remoteLoginSpy).toHaveBeenCalledWith(
      "anotherUser",
      "anotherPassword"
    );
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.UNAVAILABLE);

    flush();
  }));

  it("should update the local user object once connected", fakeAsync(() => {
    const updatedUser: DatabaseUser = {
      name: TEST_USER,
      roles: dbUser.roles.concat("admin"),
    };
    passRemoteLogin(updatedUser);

    const result = sessionService.login(TEST_USER, TEST_PASSWORD);
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(liveSyncSpy).toHaveBeenCalledTimes(1);

    const currentUser = localSession.getCurrentUser();
    expect(currentUser.name).toEqual(TEST_USER);
    expect(currentUser.roles).toEqual(["user_app", "admin"]);
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    tick();
  }));

  testSessionServiceImplementation(() => Promise.resolve(sessionService));

  function passRemoteLogin(response: DatabaseUser = { name: "", roles: [] }) {
    mockHttpClient.post.and.returnValue(of(response));
  }

  function failRemoteLogin(offline = false) {
    let rejectError;
    if (!offline) {
      rejectError = new HttpErrorResponse({
        status: remoteSession.UNAUTHORIZED_STATUS_CODE,
      });
    }
    mockHttpClient.post.and.returnValue(throwError(rejectError));
  }
});
