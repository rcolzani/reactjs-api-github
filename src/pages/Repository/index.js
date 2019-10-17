import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';

import api from '../../services/api';
import Container from '../../components/Container';
import {
  Loading,
  Owner,
  FilterIssues,
  IssueList,
  IssuePagination,
} from './styles';
// import { Container } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filters: [
      { filter: 'all', description: 'Todas', active: true },
      { filter: 'open', description: 'Abertas', active: false },
      { filter: 'closed', description: 'Fechadas', active: false },
    ],
    filterIndex: 0,
    CurrentPage: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'open',
        },
      }),
    ]);

    this.setState({
      loading: false,
      repository: repository.data,
      issues: issues.data,
    });
  }

  filterClick = async filterIndex => {
    this.setState({ filterIndex, CurrentPage: 1 });
    await this.loadIssues();
  };

  async loadIssues() {
    const { repository, filters, filterIndex, CurrentPage } = this.state;

    const issues = await api.get(`/repos/${repository.full_name}/issues`, {
      params: {
        state: filters[filterIndex].filter,
        page: CurrentPage,
      },
    });

    this.setState({
      loading: false,
      issues: issues.data,
    });
  }

  paginationClick = async action => {
    const { CurrentPage } = this.state;

    this.setState({
      CurrentPage: action === 'back' ? CurrentPage - 1 : CurrentPage + 1,
    });
    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      filters,
      filterIndex,
      CurrentPage,
    } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <IssueList>
          <FilterIssues active={filterIndex}>
            {filters.map((filter, index) => (
              <button
                type="button"
                active={filter.active}
                key={filter.filter}
                onClick={() => this.filterClick(index)}
              >
                {filter.description}
              </button>
            ))}
          </FilterIssues>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
          <IssuePagination CurrentPage>
            <button
              onClick={() => this.paginationClick('back')}
              disabled={CurrentPage <= 1}
              type="button"
            >
              <FaArrowLeft color="#fff" size={16} />
            </button>
            <span>{CurrentPage}</span>
            <button type="button" onClick={() => this.paginationClick('next')}>
              <FaArrowRight color="#fff" size={16} />
            </button>
          </IssuePagination>
        </IssueList>
      </Container>
    );
  }
}
