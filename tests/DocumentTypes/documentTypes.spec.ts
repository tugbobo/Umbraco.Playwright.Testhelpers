import { expect, request } from '@playwright/test';
import { test, ApiHelpers, UiHelpers } from '../../umbraco/helpers';
import {DocumentTypeBuilder} from "../../umbraco/builders";

test.describe('feature foo', () => {
  test.beforeEach(async ({ page, umbracoApi }) => {
    await umbracoApi.login();
  });

  test('Create document type', async ({ page, umbracoApi, umbracoUi }) => {
    const name = "Test document type";

    await umbracoApi.documentTypes.EnsureNameNotExists(name);
    await umbracoApi.templates.EnsureNameNotExists(name);

    await umbracoUi.goToSection('settings');

    await expect((await page.locator('li .umb-tree-root:has-text("Settings")'))).toBeVisible();

    const documentTypeElement = await umbracoUi.getTreeItem("settings", ["Document Types"]);
    await documentTypeElement.click({button: "right"});


    await umbracoUi.clickElement(umbracoUi.getContextMenuAction("action-create"));
    await umbracoUi.clickElement(umbracoUi.getContextMenuAction("action-documentType"));

    await umbracoUi.setEditorHeaderName(name);

    // TODO: Create an GetButtonByDataElement? seems like it could be useful
    // Add a property group
    await page.locator('[data-element="group-add"]').click();
    await page.locator('.umb-group-builder__group-title-input').type('Group name');
    // Add a property
    await page.locator('[data-element="property-add"]').click();
    await page.locator('.editor-label').type('property name');
    await page.locator('[data-element="editor-add"]').click();

    // Search for textstring
    await page.locator('#datatype-search').type('Textstring');

    await page
      .locator('ul.umb-card-grid li [title="Textstring"]')
      .locator("xpath=ancestor::li")
      .click();

    await page.locator(".btn-success").last().click();
    await page.locator(".btn-success").click();

    await umbracoUi.isSuccessNotificationVisible();

    await umbracoApi.documentTypes.EnsureNameNotExists(name);
    await umbracoApi.templates.EnsureNameNotExists(name);
  });

  test('Delete document type', async ({ page, umbracoApi, umbracoUi }) => {
    const name = "Test document type";

    await umbracoApi.documentTypes.EnsureNameNotExists(name);
    await umbracoApi.templates.EnsureNameNotExists(name);

    const documentType = new DocumentTypeBuilder()
      .withName(name)
      .build();

    await umbracoApi.documentTypes.saveDocumentType(documentType);

    await umbracoUi.goToSection('settings');
    await expect((await page.locator('li .umb-tree-root:has-text("Settings")'))).toBeVisible();

    await umbracoUi.clickElement(umbracoUi.getTreeItem("settings", ["Document Types", name]), {button: "right"})
    await umbracoUi.clickElement(umbracoUi.getContextMenuAction("action-delete"));
    await page.locator('label.checkbox').click();
    await umbracoUi.clickElement(umbracoUi.getButtonByLabelKey("delete"));
    
    const docTypeLocator = await page.locator("text=" + name);
    await expect(docTypeLocator).toHaveCount(0);
    
    await umbracoApi.documentTypes.EnsureNameNotExists(name);
    await umbracoApi.templates.EnsureNameNotExists(name);
  });
});
