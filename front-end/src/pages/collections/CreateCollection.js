import React from 'react';
import CollectionForm from './CollectionForm';

function CreateCollection() {
  const handleSubmit = async (formData) => {
    const response = await fetch('/api/collections', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create collection');
    }

    const data = await response.json();
    return { redirectUrl: `/body/${data.collection_id}` };
  };

  return (
    <CollectionForm
      mode="create"
      onSubmit={handleSubmit}
    />
  );
}

export default CreateCollection;