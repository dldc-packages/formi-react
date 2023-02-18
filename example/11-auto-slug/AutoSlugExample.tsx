import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { FormiController, FormiField, useFormi } from '../../src';
import { IssueBox } from '../utils/IssueBox';
import { slugify } from '../utils/slugify';
import { useAsync } from '../utils/useAsync';

const FORM_NAME = 'auto-slug';

const SLUG_REGEX = /^[a-z0-9-]+$/;

export type SlugIssue = { kind: 'SlugAlreadyUsed' };

const initialFields = {
  name: FormiField.string().zodValidate(z.string().min(1)),
  slug: FormiField.string().zodValidate(z.string().min(3).regex(SLUG_REGEX)).withIssue<SlugIssue>(),
};

export function AutoSlugExample() {
  // This code is a proxy for a server call
  const { status, run } = useAsync(async (data: FormData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const res = FormiController.validate({ formName: FORM_NAME, initialFields }, data);
    if (res.success === false) {
      return { success: false, issues: res.issues };
    }
    const { value, fields, customIssues } = res;
    if (value.slug === 'demo') {
      customIssues.add(fields.slug, { kind: 'SlugAlreadyUsed' });
    }
    if (customIssues.hasIssues()) {
      return { success: false, issues: customIssues.getIssues() };
    }
    return { success: true, value };
  });

  const submitting = status.status === 'pending';

  const { fields, Form, useFieldsState, controller } = useFormi({
    initialFields,
    formName: FORM_NAME,
    onSubmit: ({ formData }, actions) => {
      actions.preventDefault();
      run(formData);
    },
    onReset: () => {
      setName('');
      setSlug(null);
    },
    issues: status.status === 'resolved' && status.data.success === false ? status.data.issues : undefined,
  });

  const { name: nameState, slug: slugState } = useFieldsState(fields);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState<string | null>(null);

  const slugValue = slug ? slug : slugify(name);

  useEffect(() => {
    // since we dynamically change the value of the slug input (or rather React is doing it) there are no `change` event
    // so we need to manually revalidate the field
    controller.revalidate(fields.slug);
  }, [controller, fields.slug, slugValue]);

  return (
    <Form>
      <h2>Auto slug Example</h2>
      <p>In this example we automatically populate the slug input from the name</p>
      <p>
        We also simulate server validation (the slug <code>demo</code> is already taken)
      </p>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
        <div>
          <input
            type="text"
            name={nameState.name}
            style={{ flex: 1 }}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <IssueBox issues={nameState.touchedIssues} />
        </div>
        <div>
          <input
            type="text"
            name={slugState.name}
            style={{ flex: 1 }}
            placeholder="slug"
            value={slugValue}
            onChange={(e) => setSlug(e.currentTarget.value)}
          />
          <IssueBox issues={slugState.touchedIssues} />
        </div>
      </div>
      <div className="buttons">
        <button type="submit" disabled={submitting}>
          Submit
        </button>
        <button type="reset" disabled={submitting}>
          Reset
        </button>
      </div>
    </Form>
  );
}
