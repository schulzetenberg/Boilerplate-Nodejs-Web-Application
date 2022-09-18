import React, { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Snackbar, SnackbarContent, Avatar } from '@mui/material';
import { Theme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import SettingsIcon from '@mui/icons-material/Settings';
import { useParams } from 'react-router-dom';

import { ErrorList, Request, parseCamelCase } from '@schulzetenberg/component-library';

import MusicSettings from './music-settings';
import GoodreadsSettings from './goodreads-settings';
import PlayerFmSettings from './player-fm-settings';
import FeedlySettings from './feedly-settings';
import StatesSettings from './states-settings';
import GithubSettings from './github-settings';
import FuellySettings from './fuelly-settings';
import TmdbSettings from './tmdb-settings';
import TraktSettings from './trakt-settings';
import InstagramSettings from './instagram-settings';
import ParksSettings from './parks-settings';
import AllocationSettings from './allocation-settings';
import { ServerResponse } from '../../types/response';

const useStyles = makeStyles((theme: Theme) => ({
  snackbarContent: {
    color: theme.palette.secondary.main,
  },
  '@global': {
    body: {
      backgroundColor: theme.palette.common.white,
    },
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  content: {
    marginTop: theme.spacing(3),
    width: '100%',
  },
}));

const AppSettings: React.FC = () => {
  const { appName = '' } = useParams<{ appName: string }>();
  const classes = useStyles();
  const [responseErrors, setResponseErrors] = useState<string[]>([]);
  const [data, setData]: any = useState();
  const [isLoading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadData = async (): Promise<void> => {
    setLoading(true);

    try {
      const { data: response }: ServerResponse = await Request.get({ url: '/app-config/config' });
      setData(response.data);
    } catch (e: any) {
      setResponseErrors(e);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (body: any): Promise<void> => {
    setResponseErrors([]);
    setSaveSuccess(false);

    try {
      const { data: response }: ServerResponse = await Request.post({
        url: '/app-config/config',
        body: { ...body, appName },
      });
      setData(response.data);
      setSaveSuccess(true);
    } catch (e: any) {
      setResponseErrors(e);
    }
  };

  const submit = (formData: FormData): void => {
    const toSave = {
      ...data,
      [appName]: {
        ...data[appName],
        ...formData,
      },
    };

    setData(toSave);
    saveData(toSave);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseAppProps = {
    submit,
    isLoading,
  };

  const wideContainer = ['allocation', 'fuelly'];

  return (
    <>
      <Snackbar
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={saveSuccess}
        onClose={(): void => {
          setSaveSuccess(false);
        }}
      >
        <SnackbarContent className={classes.snackbarContent} message={<span>Saved settings</span>} />
      </Snackbar>

      <Container component="main" maxWidth={wideContainer.includes(appName) ? 'lg' : 'xs'}>
        <Box mt={5}>
          <div className={classes.paper}>
            <Avatar className={classes.avatar}>
              <SettingsIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              {parseCamelCase(appName)} Settings
            </Typography>
            <div className={classes.content}>
              <ErrorList errors={responseErrors} />
              {
                (
                  {
                    music: <MusicSettings data={data && data.music} {...baseAppProps} />,
                    goodreads: <GoodreadsSettings data={data && data.goodreads} {...baseAppProps} />,
                    feedly: <FeedlySettings data={data && data.feedly} {...baseAppProps} />,
                    playerFm: <PlayerFmSettings data={data && data.playerFm} {...baseAppProps} />,
                    states: <StatesSettings data={data && data.states} {...baseAppProps} />,
                    parks: <ParksSettings data={data && data.parks} {...baseAppProps} />,
                    countries: <StatesSettings data={data && data.countries} {...baseAppProps} />,
                    github: <GithubSettings data={data && data.github} {...baseAppProps} />,
                    fuelly: <FuellySettings data={data && data.fuelly} {...baseAppProps} />,
                    tmdb: <TmdbSettings data={data && data.tmdb} {...baseAppProps} />,
                    trakt: <TraktSettings data={data && data.trakt} {...baseAppProps} />,
                    instagram: <InstagramSettings data={data && data.instagram} {...baseAppProps} />,
                    allocation: <AllocationSettings data={data && data.allocation} {...baseAppProps} />,
                  } as any
                )[appName]
              }
            </div>
          </div>
        </Box>
      </Container>
    </>
  );
};

export default AppSettings;
