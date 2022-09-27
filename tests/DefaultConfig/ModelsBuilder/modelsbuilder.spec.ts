import {AliasHelper, ApiHelpers, ConstantHelper, test} from '../../../lib';
import {expect} from "@playwright/test";
import {
  ContentBuilder,
  DocumentTypeBuilder,
} from "@umbraco/playwright-models";

test.describe('Modelsbuilder tests', () => {

  test.beforeEach(async ({page, umbracoApi}) => {
    await umbracoApi.login();
  });

  test('Can create and render content', async ({page, umbracoApi, umbracoUi}) => {
    const docTypeName = "TestDocument";
    const docTypeAlias = AliasHelper.toAlias(docTypeName);
    const contentName = "Home";
    
    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(docTypeName);

    var docType = new DocumentTypeBuilder()
      .withName(docTypeName)
      .withAlias(docTypeAlias)
      .withAllowAsRoot(true)
      .withDefaultTemplate(docTypeAlias)
      .addTab()
        .withName("Content")
        .addTextBoxProperty()
          .withAlias("title")
        .done()
      .done()
      .build();
    
    await umbracoApi.documentTypes.save(docType);
    await umbracoApi.templates.edit(docTypeName, `@using Umbraco.Cms.Web.Common.PublishedModels;
@inherits Umbraco.Cms.Web.Common.Views.UmbracoViewPage<ContentModels.Testdocument>
@using ContentModels = Umbraco.Cms.Web.Common.PublishedModels;
@{
\tLayout = null;
}

<h1>@Model.Title</h1>`);
    
    // Time to manually create the content
    await umbracoUi.createContentWithDocumentType(docTypeName);
    await umbracoUi.setEditorHeaderName(contentName);
    // Fortunately for us the input field of a text box has the alias of the property as an id :)
    await page.locator("#title").type("Hello world!")
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.saveAndPublish));
    await umbracoUi.isSuccessNotificationVisible();
    // Ensure that we can render it on the frontend = we can compile the models and views
    await umbracoApi.content.verifyRenderedContent("/", "<h1>Hello world!</h1>", true)
  });
 
});

