import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { User } from "./user";
import { faker } from "../demo-data/faker";
import { LocalSession } from "../session/session-service/local-session";

/**
 * Generate demo users for the application with its DemoDataModule.
 */
@Injectable()
export class DemoUserGeneratorService extends DemoDataGenerator<User> {
  /** the username of the basic account generated by this demo service */
  static DEFAULT_USERNAME = "demo";
  /** the password of all accounts generated by this demo service */
  static DEFAULT_PASSWORD = "pass";

  /**
   * This function returns a provider object to be used in an Angular Module configuration
   *
   * @return `providers: [DemoUserGeneratorService.provider()]`
   */
  static provider() {
    return [
      { provide: DemoUserGeneratorService, useClass: DemoUserGeneratorService },
    ];
  }

  /**
   * Generate User entities to be loaded by the DemoDataModule.
   */
  public generateEntities(): User[] {
    const users = [];
    const demoUser = new User(DemoUserGeneratorService.DEFAULT_USERNAME);
    demoUser.name = DemoUserGeneratorService.DEFAULT_USERNAME;

    const demoAdmin = new User("demo-admin");
    demoAdmin.name = "demo-admin";

    // Create temporary session to save users to local storage
    const tmpLocalSession = new LocalSession(null);
    tmpLocalSession.saveUser(
      { name: demoUser.name, roles: ["user_app"] },
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
    tmpLocalSession.saveUser(
      { name: demoAdmin.name, roles: ["user_app", "admin_app"] },
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );

    users.push(demoUser, demoAdmin);

    for (let i = 0; i < 10; ++i) {
      const user = new User(String(i));
      user.name = faker.name.firstName();
      users.push(user);
    }

    return users;
  }
}
