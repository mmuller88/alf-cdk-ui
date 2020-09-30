"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendStage = void 0;
const core_1 = require("@aws-cdk/core");
const accountConfig_1 = require("./accountConfig");
const app_1 = require("./app");
const ui_stack_1 = require("./ui-stack");
/**
 * Deployable unit of web service app
 */
class FrontendStage extends core_1.Stage {
    constructor(scope, id, props) {
        super(scope, id, props);
        const uiStackProps = {
            // env: {
            //   account: prodAccount.id,
            //   region: prodAccount.region,
            // },
            stage: accountConfig_1.prodAccount.stage,
            domainName: accountConfig_1.prodAccount.domainName,
            acmCertRef: accountConfig_1.prodAccount.acmCertRef,
            subDomain: accountConfig_1.prodAccount.subDomain,
        };
        console.info(`${accountConfig_1.prodAccount.stage} UIStackProps: ${JSON.stringify(uiStackProps, null, 2)}`);
        // tslint:disable-next-line: no-unused-expression
        new ui_stack_1.UIStack(this, `${app_1.config.repositoryName}-${accountConfig_1.prodAccount.stage}`, uiStackProps);
        // Expose CdkpipelinesDemoStack's output one level higher
        // this.urlOutput = service.urlOutput;
    }
}
exports.FrontendStage = FrontendStage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmQtc3RhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9jZGsvZnJvbnRlbmQtc3RhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsd0NBQXdFO0FBQ3hFLG1EQUE4QztBQUM5QywrQkFBK0I7QUFDL0IseUNBQW1EO0FBRW5EOztHQUVHO0FBQ0gsTUFBYSxhQUFjLFNBQVEsWUFBSztJQUd0QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sWUFBWSxHQUFrQjtZQUNsQyxTQUFTO1lBQ1QsNkJBQTZCO1lBQzdCLGdDQUFnQztZQUNoQyxLQUFLO1lBQ0wsS0FBSyxFQUFFLDJCQUFXLENBQUMsS0FBSztZQUN4QixVQUFVLEVBQUUsMkJBQVcsQ0FBQyxVQUFVO1lBQ2xDLFVBQVUsRUFBRSwyQkFBVyxDQUFDLFVBQVU7WUFDbEMsU0FBUyxFQUFFLDJCQUFXLENBQUMsU0FBUztTQUVqQyxDQUFBO1FBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLDJCQUFXLENBQUMsS0FBSyxrQkFBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUU1RixpREFBaUQ7UUFDakQsSUFBSSxrQkFBTyxDQUFDLElBQUksRUFBRSxHQUFHLFlBQU0sQ0FBQyxjQUFjLElBQUksMkJBQVcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUVqRix5REFBeUQ7UUFDekQsc0NBQXNDO0lBQ3hDLENBQUM7Q0FDRjtBQXpCRCxzQ0F5QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDZm5PdXRwdXQsIENvbnN0cnVjdCwgU3RhZ2UsIFN0YWdlUHJvcHMgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IHByb2RBY2NvdW50IH0gZnJvbSAnLi9hY2NvdW50Q29uZmlnJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJy4vYXBwJztcbmltcG9ydCB7IFVJU3RhY2ssIFVJU3RhY2tQcm9wcyB9IGZyb20gJy4vdWktc3RhY2snO1xuXG4vKipcbiAqIERlcGxveWFibGUgdW5pdCBvZiB3ZWIgc2VydmljZSBhcHBcbiAqL1xuZXhwb3J0IGNsYXNzIEZyb250ZW5kU3RhZ2UgZXh0ZW5kcyBTdGFnZSB7XG4gIHB1YmxpYyByZWFkb25seSB1cmxPdXRwdXQ6IENmbk91dHB1dDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWdlUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHVpU3RhY2tQcm9wcyA6IFVJU3RhY2tQcm9wcyA9IHtcbiAgICAgIC8vIGVudjoge1xuICAgICAgLy8gICBhY2NvdW50OiBwcm9kQWNjb3VudC5pZCxcbiAgICAgIC8vICAgcmVnaW9uOiBwcm9kQWNjb3VudC5yZWdpb24sXG4gICAgICAvLyB9LFxuICAgICAgc3RhZ2U6IHByb2RBY2NvdW50LnN0YWdlLFxuICAgICAgZG9tYWluTmFtZTogcHJvZEFjY291bnQuZG9tYWluTmFtZSxcbiAgICAgIGFjbUNlcnRSZWY6IHByb2RBY2NvdW50LmFjbUNlcnRSZWYsXG4gICAgICBzdWJEb21haW46IHByb2RBY2NvdW50LnN1YkRvbWFpbixcbiAgICAgIC8vIHN1YkRvbWFpbjogYWNjb3VudC5zdWJEb21haW4sXG4gICAgfVxuICAgIGNvbnNvbGUuaW5mbyhgJHtwcm9kQWNjb3VudC5zdGFnZX0gVUlTdGFja1Byb3BzOiAke0pTT04uc3RyaW5naWZ5KHVpU3RhY2tQcm9wcywgbnVsbCwgMil9YCk7XG5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXVudXNlZC1leHByZXNzaW9uXG4gICAgbmV3IFVJU3RhY2sodGhpcywgYCR7Y29uZmlnLnJlcG9zaXRvcnlOYW1lfS0ke3Byb2RBY2NvdW50LnN0YWdlfWAsIHVpU3RhY2tQcm9wcyk7XG5cbiAgICAvLyBFeHBvc2UgQ2RrcGlwZWxpbmVzRGVtb1N0YWNrJ3Mgb3V0cHV0IG9uZSBsZXZlbCBoaWdoZXJcbiAgICAvLyB0aGlzLnVybE91dHB1dCA9IHNlcnZpY2UudXJsT3V0cHV0O1xuICB9XG59XG4iXX0=