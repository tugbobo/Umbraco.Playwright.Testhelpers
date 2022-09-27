﻿import {AliasHelper, ApiHelpers, ConstantHelper, test, UiHelpers} from '../../../lib';
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

    const docType = new DocumentTypeBuilder()
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

  test('Can update document type without updating view', async ({page, umbracoApi, umbracoUi}) => {
    const docTypeName = "TestDocument";
    const docTypeAlias = AliasHelper.toAlias(docTypeName);
    const propertyAlias = "title";
    const propertyValue = "Hello world!"

    await umbracoApi.content.deleteAllContent();
    await umbracoApi.documentTypes.ensureNameNotExists(docTypeName);

    const docType = new DocumentTypeBuilder()
      .withName(docTypeName)
      .withAlias(docTypeAlias)
      .withAllowAsRoot(true)
      .withDefaultTemplate(docTypeAlias)
      .addTab()
        .withName("Content")
        .addTextBoxProperty()
          .withAlias(propertyAlias)
        .done()
      .done()
      .build();

    const savedDocType = await umbracoApi.documentTypes.save(docType);
    await umbracoApi.templates.edit(docTypeName, `@using Umbraco.Cms.Web.Common.PublishedModels;
@inherits Umbraco.Cms.Web.Common.Views.UmbracoViewPage<ContentModels.Testdocument>
@using ContentModels = Umbraco.Cms.Web.Common.PublishedModels;
@{
\tLayout = null;
}

<h1>@Model.Title</h1>`);
    
    const content = new ContentBuilder()
      .withContentTypeAlias(savedDocType["alias"])
      .withAction("publishNew")
      .addVariant()
        .withName("Home")
        .withSave(true)
        .withPublish(true)
        .addProperty()
          .withAlias(propertyAlias)
          .withValue(propertyValue)
        .done()
      .done()
      .build()
    
    await umbracoApi.content.save(content);

    // Navigate to the document type
    await umbracoUi.goToSection(ConstantHelper.sections.settings);
    await umbracoUi.clickElement(umbracoUi.getTreeItem("settings", ["Document Types", docTypeName]));
    // Add a new property (this might cause a version error if the viewcache is not cleared, hence this test
    await page.locator('.umb-box-content >> [data-element="property-add"]').click();
    await page.locator('[data-element="property-name"]').type("Second Title");
    await page.locator('[data-element="editor-add"]').click();
    await page.locator('[input-id="datatype-search"]').type("Textstring");
    await page.locator('.umb-card-grid >> [title="Textstring"]').click();
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.submit));
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey(ConstantHelper.buttons.save));
    await umbracoUi.isSuccessNotificationVisible();
    
    // Now that the content is updated and the models are rebuilt, ensure that we can still render the frontend.
    await umbracoApi.content.verifyRenderedContent("/", "<h1>" + propertyValue + "</h1>", true)
  });
});

